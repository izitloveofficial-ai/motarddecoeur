import { test } from "node:test";
import assert from "node:assert/strict";
import { DATING_QUESTIONS, DATING_QUIZ_CONSENT_VERSION, DATING_QUIZ_VERSION, buildDatingEmail, buildDatingReport } from "./dating-quiz.ts";
import { quizSubmissionSchema, QUIZ_CONSENT_VERSION } from "./quiz-submission.ts";

test("all 729 combinations cover every answer and have distinct reports, for both signup choices", () => {
  const seen = new Set<string>();
  for (let n=0;n<729;n++) {
    const answers=Array.from({length:6},(_,i)=>Math.floor(n/3**i)%3);
    const report=buildDatingReport(answers)!;
    assert.equal(report.sections.length,6);
    assert.equal(report.advice.length,3);
    for (const signup of [false,true]) {
      const mail=buildDatingEmail("Camille",answers,signup)!;
      DATING_QUESTIONS.forEach((q,i) => {
        assert.ok(mail.text.includes(q.options[answers[i]].summary));
        assert.ok(mail.text.includes(q.options[answers[i]].label));
        assert.ok(mail.html.includes(q.options[answers[i]].summary));
      });
      assert.ok(!mail.text.includes("undefined") && !mail.text.includes("NaN"));
      assert.ok(!mail.text.includes("—"));
      assert.ok(mail.text.includes(signup ? "Tu as également demandé ta préinscription" : "Tu n’as pas demandé de préinscription"));
    }
    seen.add(JSON.stringify(report));
  }
  assert.equal(seen.size,729);
});

test("question choices change only their related report sections and advice", () => {
  const base=buildDatingReport([0,0,0,0,0,0])!;
  for(let i=0;i<6;i++){
    const answers=[0,0,0,0,0,0];answers[i]=1;
    const changed=buildDatingReport(answers)!;
    assert.notEqual(changed.sections[i].text,base.sections[i].text);
    for(let j=0;j<6;j++)if(i!==j)assert.deepEqual(changed.sections[j],base.sections[j]);
  }
});

test("invalid or incomplete answers never produce a report or email", () => {
  for(const a of [[],[0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,-1],[0,0,0,0,0,3],[0,0,0,0,0,0.5],[0,0,0,0,0,NaN]]){
    assert.equal(buildDatingReport(a),null);assert.equal(buildDatingEmail("Camille",a,false),null);
  }
});

test("HTML emails escape participant input and nuanced preferences aren't treated as diagnoses",()=>{
  const mail=buildDatingEmail('<img src=x onerror="alert(1)">',[2,0,0,0,0,2],false)!;
  assert.ok(!mail.html.includes('<img src=x'));
  assert.ok(mail.html.includes('&lt;img src=x'));
  assert.ok(buildDatingReport([2,0,0,0,0,2])!.nuance);
  assert.ok(buildDatingReport([0,0,0,0,0,1])!.nuance);
});

test("legacy clients remain valid; wrong version lengths, missing consent and forged report are rejected",()=>{
  const shared={request_id:"0c0ae776-962b-4a0e-b10e-02d425569004",first_name:"Camille",email:"camille@example.com",preinscribe:false,consent:true,adult:true,website:""};
  assert.ok(quizSubmissionSchema.safeParse({...shared,answers:[0,1,2,0,1],consent_version:QUIZ_CONSENT_VERSION}).success);
  const valid={...shared,answers:[0,1,2,0,1,2],quiz_version:DATING_QUIZ_VERSION,consent_version:DATING_QUIZ_CONSENT_VERSION};
  assert.ok(quizSubmissionSchema.safeParse(valid).success);
  for(const invalid of [{...valid,answers:[0,1,2,0,1]},{...valid,quiz_version:"unknown"},{...valid,consent_version:QUIZ_CONSENT_VERSION},{...valid,adult:false},{...valid,consent:false},{...valid,preinscribe:undefined},{...valid,report:"forged"}])assert.ok(!quizSubmissionSchema.safeParse(invalid).success);
});

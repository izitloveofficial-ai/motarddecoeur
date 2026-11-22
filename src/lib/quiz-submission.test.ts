import { describe, expect, it } from "bun:test";
import { QUIZ_CONSENT_VERSION, quizSubmissionSchema } from "./quiz-submission";

const valid = { request_id: "0c0ae776-962b-4a0e-b10e-02d425569004", first_name: "Camille", email: " CAMILLE@example.com ", answers: [0,1,2,0,1], preinscribe: false, consent: true, adult: true, consent_version: QUIZ_CONSENT_VERSION, website: "" };
describe("quiz submission consent and validation", () => {
  it("normalizes the email and preserves the explicit No", () => {
    const data = quizSubmissionSchema.parse(valid);
    expect(data.email).toBe("camille@example.com"); expect(data.preinscribe).toBe(false);
  });
  it("requires an explicit preinscription choice and storage consent", () => {
    for (const value of [{ ...valid, preinscribe: undefined }, { ...valid, preinscribe: "yes" }, { ...valid, consent: false }, { ...valid, adult: false }]) expect(quizSubmissionSchema.safeParse(value).success).toBe(false);
  });
  it("rejects forged answers, short names, extra fields and honeypot", () => {
    for (const value of [{ ...valid, answers: [0,1] }, { ...valid, answers: [0,1,2,0,4] }, { ...valid, first_name: "A" }, { ...valid, result_profile: "aventure" }, { ...valid, website: "bot" }]) expect(quizSubmissionSchema.safeParse(value).success).toBe(false);
  });
});

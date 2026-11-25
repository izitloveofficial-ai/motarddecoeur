import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Heart, RotateCcw, Share2 } from "lucide-react";
import { DATING_QUESTIONS, buildDatingReport } from "@/lib/dating-quiz";
import { SITE_URL } from "@/lib/site";
import { QuizResultForm } from "./QuizResultForm";

const buttonClass = "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-base font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300";

export function LoveQuiz() {
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<number[]>([]);
  const [shareStatus, setShareStatus] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const result = buildDatingReport(answers);
  const finished = step === DATING_QUESTIONS.length && result !== null;
  const question = step >= 0 && step < DATING_QUESTIONS.length ? DATING_QUESTIONS[step] : null;
  const selected = answers[step];
  useEffect(() => { if (step >= 0) heading.current?.focus({ preventScroll: true }); }, [step]);

  async function share() {
    const text = "Qu’as-tu envie de vivre dans une rencontre ? Fais le quiz gratuit Motards de Cœur.";
    const url = `${SITE_URL}/quiz`;
    setShareStatus("");
    try {
      if (navigator.share) {
        await navigator.share({ title: "Le quiz rencontre Motards de Cœur", text, url });
        setShareStatus("Partage effectué.");
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        setShareStatus("Le lien est copié. Tu peux le partager dans un message.");
      } else setShareStatus(`Copie ce lien pour inviter tes amis : ${url}`);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        setShareStatus(`Partage indisponible. Copie le lien : ${url}`);
    }
  }

  function choose(index: number) {
    setAnswers(previous => { const next = previous.slice(); next[step] = index; return next; });
  }

  return <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16" aria-label="Quiz rencontre Motards de Cœur">
    <div className="rounded-3xl border border-[#b77868]/30 bg-[#241a1e] p-6 text-[#fff9f0] shadow-2xl sm:p-10">
      <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-[#efbf87]">Le quiz rencontre Motards de Cœur</p>
      <h1 ref={heading} tabIndex={-1} className="font-display text-3xl leading-tight outline-none sm:text-5xl">
        {finished ? "Ton bilan de rencontre" : question ? question.title : "Et toi, qu’as-tu envie de vivre à deux ?"}
      </h1>
      {step === -1 && <div>
        <p className="mt-6 text-lg leading-relaxed text-[#e2d1c9]">Ce qui t’attire, ce que tu recherches et ton envie de faire connaissance : six questions pour mettre des mots sur tes attentes.</p>
        <p className="mt-4 text-base leading-relaxed text-[#e2d1c9]">Motard ou motarde, la passion peut vous rapprocher. À toi de dire quelle rencontre tu aimerais vivre.</p>
        <div className="my-7 flex flex-wrap gap-3 text-base text-[#efbf87]"><span>6 questions</span><span aria-hidden="true">·</span><span>Gratuit</span><span aria-hidden="true">·</span><span>Sans inscription</span></div>
        <button type="button" onClick={() => setStep(0)} className={`${buttonClass} bg-gradient-red text-white`}><Heart className="h-5 w-5" aria-hidden="true" />C’est parti</button>
      </div>}
      {question && <div>
        <div className="mb-7 mt-6">
          <p className="mb-2 text-base text-[#e2d1c9]">Question {step + 1} sur {DATING_QUESTIONS.length}</p>
          <div role="progressbar" aria-label="Progression du quiz" aria-valuenow={step+1} aria-valuemin={0} aria-valuemax={DATING_QUESTIONS.length} className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#e7ac7a]" style={{ width: `${((step+1)/DATING_QUESTIONS.length)*100}%` }} /></div>
        </div>
        <div role="group" aria-label={question.title} className="space-y-3">
          {question.options.map((option,index) => <button key={option.label} type="button" aria-pressed={selected===index} onClick={() => choose(index)} className={`flex min-h-16 w-full items-center justify-between gap-4 rounded-2xl border p-5 text-left text-base leading-relaxed transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 ${selected===index ? "border-[#efbf87] bg-[#603042]" : "border-white/20 bg-white/5 hover:border-[#efbf87]/60 hover:bg-white/10"}`}><span>{option.label}</span>{selected===index && <Check className="h-5 w-5 shrink-0 text-[#efbf87]" aria-hidden="true" />}</button>)}
        </div>
        <div className="mt-7 flex flex-wrap items-center justify-between gap-3"><button type="button" onClick={() => setStep(step-1)} className={`${buttonClass} border border-white/20`}>Retour</button><button type="button" disabled={selected===undefined} onClick={() => setStep(step+1)} className={`${buttonClass} bg-gradient-red text-white disabled:cursor-not-allowed disabled:opacity-40`}>{step===DATING_QUESTIONS.length-1 ? "Voir mon bilan" : "Continuer"}</button></div>
      </div>}
      {finished && result && <div>
        <p className="mt-5 text-base leading-relaxed text-[#e2d1c9]">Voici ce que tu as exprimé dans tes six réponses.</p>
        {result.sections.map(section => <div className="mt-5 rounded-2xl border border-white/15 bg-white/5 p-5" key={section.title}><h2 className="text-lg font-semibold text-[#efbf87]">{section.title}</h2><p className="mt-2 text-base leading-relaxed text-[#e2d1c9]">{section.text}</p></div>)}
        {result.nuance && <p className="mt-5 text-base leading-relaxed text-[#e2d1c9]">{result.nuance}</p>}
        <h2 className="mt-7 font-display text-2xl">Quelques pistes pour faire connaissance</h2>
        {result.advice.map(advice => <p className="mt-4 text-base leading-relaxed text-[#e2d1c9]" key={advice}>{advice}</p>)}
        <p className="mt-5 text-sm leading-relaxed text-[#c8b6ae]">Ce bilan reprend tes envies déclarées. Il ne calcule pas une compatibilité et n’annonce pas de personnes déjà disponibles.</p>
        <QuizResultForm key={answers.join("-")} answers={answers} />
        <div className="mt-7 flex flex-wrap gap-3"><button type="button" onClick={share} className={`${buttonClass} border border-[#efbf87]/60`}><Share2 className="h-5 w-5" aria-hidden="true" />Partager le quiz</button><button type="button" onClick={() => { setAnswers([]);setStep(0);setShareStatus(""); }} className={`${buttonClass} border border-white/20`}><RotateCcw className="h-5 w-5" aria-hidden="true" />Rejouer</button></div>
        <p role="status" className="mt-3 break-words text-base text-[#efbf87]">{shareStatus}</p>
      </div>}
      <p className="mt-8 text-sm leading-relaxed text-[#c8b6ae]">Ton bilan est visible sans adresse e-mail. Tes réponses ne sont enregistrées que si tu demandes l’envoi du bilan et acceptes leur traitement.</p>
    </div>
    <div className="mt-6 text-center"><Link to="/join" className="text-base text-[#efbf87] underline underline-offset-4">Retour à la préinscription</Link></div>
  </section>;
}

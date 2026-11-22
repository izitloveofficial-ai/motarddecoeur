import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Heart, RotateCcw, Share2 } from "lucide-react";
import { QUIZ_PROFILES, QUIZ_QUESTIONS, getQuizResult } from "@/lib/love-quiz";
import roadPhoto from "@/assets/cta-road.jpg";
import { SITE_URL } from "@/lib/site";
import { QuizResultForm } from "./QuizResultForm";

const buttonClass =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-base font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300";

export function LoveQuiz() {
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<number[]>([]);
  const [shareStatus, setShareStatus] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const resultKey = getQuizResult(answers);
  const result = resultKey ? QUIZ_PROFILES[resultKey] : null;
  const finished = step === QUIZ_QUESTIONS.length && result !== null;
  const question = step >= 0 && step < QUIZ_QUESTIONS.length ? QUIZ_QUESTIONS[step] : null;
  const selected = answers[step];

  useEffect(() => {
    if (step >= 0) heading.current?.focus({ preventScroll: true });
  }, [step]);

  async function share() {
    if (!result) return;
    const text = `Mon profil amoureux à moto : ${result.title} ! Et vous ? Faites le quiz Motards de Cœur.`;
    const url = `${SITE_URL}/quiz`;
    setShareStatus("");
    try {
      if (navigator.share) {
        await navigator.share({ title: "Mon profil amoureux à moto", text, url });
        setShareStatus("Partage effectué.");
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        setShareStatus("Votre résultat et le lien sont copiés. Collez-les dans votre message.");
      } else {
        setShareStatus(
          `Votre profil : ${result.title}. Copiez ce lien pour inviter vos amis : ${url}`,
        );
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        setShareStatus(`Partage indisponible. Copiez le lien : ${url}`);
    }
  }

  function choose(index: number) {
    setAnswers((previous) => {
      const next = previous.slice();
      next[step] = index;
      return next;
    });
  }

  return (
    <section
      className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16"
      aria-label="Quiz amoureux à moto"
    >
      <div className="rounded-3xl border border-[#b77868]/30 bg-[#241a1e] p-6 text-[#fff9f0] shadow-2xl sm:p-10">
        {step === -1 && (
          <img
            src={roadPhoto}
            alt="Une route à découvrir à moto"
            className="mb-7 h-40 w-full rounded-2xl object-cover sm:h-52"
            loading="lazy"
          />
        )}
        {question && (
          <p className="mb-4 text-4xl" aria-hidden="true">
            {question.emoji}
          </p>
        )}
        <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-[#efbf87]">
          Le petit jeu Motards de Cœur
        </p>
        <h1
          ref={heading}
          tabIndex={-1}
          className="font-display text-3xl leading-tight outline-none sm:text-5xl"
        >
          {finished
            ? "Votre profil amoureux à moto"
            : question
              ? question.title
              : "Quel est votre profil amoureux à moto ?"}
        </h1>

        {step === -1 && (
          <div>
            <p className="mt-6 text-lg leading-relaxed text-[#e2d1c9]">
              Plutôt une escapade improvisée, une conversation qui dure ou une belle table à deux ?
              Cinq questions pour découvrir votre façon de partager la route et les rencontres.
            </p>
            <div className="my-7 flex flex-wrap gap-3 text-base text-[#efbf87]">
              <span>5 questions</span>
              <span aria-hidden="true">·</span>
              <span>À votre rythme</span>
              <span aria-hidden="true">·</span>
              <span>Sans inscription</span>
            </div>
            <button
              type="button"
              onClick={() => setStep(0)}
              className={`${buttonClass} bg-gradient-red text-white`}
            >
              <Heart className="h-5 w-5" aria-hidden="true" /> Découvrir mon profil
            </button>
          </div>
        )}

        {question && (
          <div>
            <div className="mb-7 mt-6">
              <p className="mb-2 text-base text-[#e2d1c9]">
                Question {step + 1} sur {QUIZ_QUESTIONS.length}
              </p>
              <div
                role="progressbar"
                aria-label="Progression du quiz"
                aria-valuenow={step + 1}
                aria-valuemin={0}
                aria-valuemax={5}
                className="h-2 overflow-hidden rounded-full bg-white/10"
              >
                <div
                  className="h-full rounded-full bg-[#e7ac7a]"
                  style={{ width: `${((step + 1) / 5) * 100}%` }}
                />
              </div>
            </div>
            <div role="group" aria-label={question.title} className="space-y-3">
              {question.options.map((option, index) => (
                <button
                  key={option.label}
                  type="button"
                  aria-pressed={selected === index}
                  onClick={() => choose(index)}
                  className={`flex min-h-16 w-full items-center justify-between gap-4 rounded-2xl border p-5 text-left text-base leading-relaxed transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 ${selected === index ? "border-[#efbf87] bg-[#603042]" : "border-white/20 bg-white/5 hover:border-[#efbf87]/60 hover:bg-white/10"}`}
                >
                  <span>{option.label}</span>
                  {selected === index && (
                    <Check className="h-5 w-5 shrink-0 text-[#efbf87]" aria-hidden="true" />
                  )}
                </button>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className={`${buttonClass} border border-white/20`}
              >
                Retour
              </button>
              <button
                type="button"
                disabled={selected === undefined}
                onClick={() => setStep(step + 1)}
                className={`${buttonClass} bg-gradient-red text-white disabled:cursor-not-allowed disabled:opacity-40`}
              >
                {step === 4 ? "Voir mon résultat" : "Continuer"}
              </button>
            </div>
          </div>
        )}

        {finished && result && (
          <div>
            <p className="mt-7 text-5xl" aria-hidden="true">
              {result.emoji}
            </p>
            <h2 className="mt-4 font-display text-3xl text-[#efbf87]">{result.title}</h2>
            <p className="mt-5 text-lg leading-relaxed text-[#e2d1c9]">{result.description}</p>
            <p className="mt-5 rounded-2xl border border-white/15 bg-white/5 p-5 text-base leading-relaxed">
              {result.date}
            </p>
            <p className="mt-5 text-sm leading-relaxed text-[#c8b6ae]">
              Un portrait pour s’amuser, pas un test scientifique ni une promesse de compatibilité.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={share}
                className={`${buttonClass} border border-[#efbf87]/60`}
              >
                <Share2 className="h-5 w-5" aria-hidden="true" /> Partager mon profil
              </button>
              <button
                type="button"
                onClick={() => {
                  setAnswers([]);
                  setStep(0);
                  setShareStatus("");
                }}
                className={`${buttonClass} border border-white/20`}
              >
                <RotateCcw className="h-5 w-5" aria-hidden="true" /> Rejouer
              </button>
            </div>
            <p role="status" className="mt-3 break-words text-base text-[#efbf87]">
              {shareStatus}
            </p>
            <QuizResultForm key={answers.join("-")} answers={answers} />
          </div>
        )}
        <p className="mt-8 text-sm leading-relaxed text-[#c8b6ae]">
          Votre résultat est visible sans adresse e-mail. Vos réponses ne sont enregistrées
          que si vous demandez l’envoi du résultat et acceptez leur traitement.
        </p>
      </div>
      <div className="mt-6 text-center">
        <Link to="/join" className="text-base text-[#efbf87] underline underline-offset-4">
          Retour à la préinscription
        </Link>
      </div>
    </section>
  );
}

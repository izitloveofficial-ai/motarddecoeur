import { useRef, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { QUIZ_CONSENT_VERSION, quizSubmissionSchema } from "@/lib/quiz-submission";

export function QuizResultForm({ answers }: { answers: number[] }) {
  const [choice, setChoice] = useState<"yes" | "no" | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [notice, setNotice] = useState("");
  const requestId = useRef<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending" || choice === null) return;
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const values = new FormData(form);
    if (values.get("website")) return;
    requestId.current ??= crypto.randomUUID();
    const parsed = quizSubmissionSchema.safeParse({
      request_id: requestId.current,
      first_name: values.get("first_name"), email: values.get("email"), answers,
      preinscribe: choice === "yes", consent: values.get("consent") === "on",
      adult: values.get("adult") === "on", consent_version: QUIZ_CONSENT_VERSION,
      website: "",
    });
    if (!parsed.success) return setNotice("Vérifiez votre prénom, votre e-mail et les cases à cocher.");
    if (!supabase) return setNotice("L’envoi est indisponible pour le moment. Votre résultat reste visible.");
    setStatus("sending");
    setNotice("");
    try {
      const { data, error } = await supabase.functions.invoke("submit-love-quiz", { body: parsed.data });
      if (error || !data?.ok) {
        let message = "Impossible d’enregistrer votre demande. Réessayez dans quelques instants.";
        if (error && "context" in error && error.context instanceof Response && error.context.status === 429)
          message = "Vous avez déjà effectué plusieurs demandes. Réessayez plus tard.";
        setStatus("idle");
        setNotice(message);
        return;
      }
      setStatus("done");
      setNotice([
        data.email_sent ? "Votre résultat a été envoyé par e-mail. Pensez à vérifier les indésirables." :
          "Vos réponses sont enregistrées, mais l’e-mail n’a pas pu être envoyé. Votre résultat reste affiché ici.",
        choice === "yes" ? "Votre demande de préinscription est enregistrée ; si cette adresse est déjà connue, son statut est conservé." :
          "Vous n’avez pas demandé de préinscription. Cet envoi ne vous abonne à aucune actualité.",
      ].join(" "));
    } catch {
      setStatus("idle");
      setNotice("Connexion interrompue. Vous pouvez réessayer sans créer de doublon.");
    }
  }

  return <section className="mt-8 rounded-2xl border border-[#efbf87]/40 bg-[#361c25] p-5 sm:p-6" aria-labelledby="quiz-email-title">
    <h2 id="quiz-email-title" className="font-display text-2xl">Gardez votre résultat par e-mail</h2>
    <p className="mt-3 text-base leading-relaxed text-[#e2d1c9]">Recevez votre portrait et le récapitulatif de vos réponses. C’est gratuit et facultatif.</p>
    {status !== "done" && <form onSubmit={submit} onChange={() => { if (status === "idle") requestId.current = null; }} className="mt-5 space-y-5">
      <fieldset disabled={status === "sending"} className="space-y-5">
        <label className="block text-base">Votre prénom
          <input name="first_name" autoComplete="given-name" required minLength={2} maxLength={80} className="mt-2 min-h-12 w-full rounded-xl border border-white/30 bg-[#241a1e] px-4 text-base" />
        </label>
        <label className="block text-base">Votre adresse e-mail
          <input name="email" type="email" autoComplete="email" required maxLength={254} className="mt-2 min-h-12 w-full rounded-xl border border-white/30 bg-[#241a1e] px-4 text-base" />
        </label>
        <div className="hidden" aria-hidden="true"><label>Site web<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
        <fieldset>
          <legend className="text-lg font-semibold">Souhaitez-vous vous préinscrire ?</legend>
          <p className="mt-2 text-base text-[#e2d1c9]">En choisissant Oui, vous demandez à être informé de l’ouverture de Motards de Cœur. Gratuit, sans carte bancaire.</p>
          <div className="mt-3 flex gap-5">
            {([['yes', 'Oui'], ['no', 'Non']] as const).map(([value, label]) => <label key={value} className="flex min-h-12 items-center gap-3 rounded-xl border border-white/30 px-5">
              <input type="radio" name="preinscribe" value={value} required checked={choice === value} onChange={() => { setChoice(value); requestId.current = null; }} className="h-5 w-5 accent-[#ec4365]" />{label}
            </label>)}
          </div>
        </fieldset>
        <label className="flex items-start gap-3 text-base leading-relaxed"><input name="adult" type="checkbox" required className="mt-1 h-5 w-5 shrink-0 accent-[#ec4365]" />J’ai 18 ans ou plus.</label>
        <label className="flex items-start gap-3 text-base leading-relaxed"><input name="consent" type="checkbox" required className="mt-1 h-5 w-5 shrink-0 accent-[#ec4365]" /><span>J’accepte que mon prénom, mon e-mail et mes réponses soient enregistrés pour recevoir mon résultat, selon la <Link to="/confidentialite" className="underline">politique de confidentialité</Link>. Ce choix ne m’abonne pas aux actualités.</span></label>
        <button type="submit" disabled={status === "sending" || choice === null} className="min-h-12 w-full rounded-xl bg-gradient-red px-5 py-3 text-base font-semibold disabled:opacity-50">{status === "sending" ? "Enregistrement…" : choice === "yes" ? "Recevoir mon résultat et me préinscrire" : "Recevoir mon résultat"}</button>
      </fieldset>
    </form>}
    {notice && <p role="status" className="mt-4 text-base leading-relaxed text-[#efbf87]">{notice}</p>}
    <p className="mt-4 text-sm leading-relaxed text-[#c8b6ae]">Vos coordonnées et réponses ne sont pas publiques. Pour demander leur suppression : contact@motardsdecoeur.com.</p>
  </section>;
}

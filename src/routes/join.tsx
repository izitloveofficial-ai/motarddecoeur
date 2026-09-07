import { Link, createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { PrelaunchLayout } from "@/components/PrelaunchLayout";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import bikeDetail from "@/assets/bike-dark.jpg";
import { Bike, Check, CheckCircle2, HeartHandshake, Mail, MapPin, ShieldCheck } from "lucide-react";

const SITE_URL = "https://motarddecoeur.lovable.app";

const riderOptions = [
  ["motard", "Motard"],
  ["motarde", "Motarde"],
  ["passager_passagere", "Passager / passagère"],
  ["passionne_moto", "Passionné(e) de moto"],
  ["permis_en_cours", "Permis en cours"],
] as const;

const searchOptions = [
  ["rencontre_serieuse", "Une rencontre sérieuse"],
  ["balades_moto", "Des balades moto"],
  ["amitie", "De l’amitié"],
  ["communaute_motards", "Une communauté de motards"],
  ["indecis", "Je ne sais pas encore"],
] as const;

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "Pré-inscription gratuite — Motards de Cœur" },
      {
        name: "description",
        content:
          "Pré-inscrivez-vous gratuitement à Motards de Cœur pour être recontacté au lancement : rencontres, balades, amitié et communauté motarde.",
      },
      { property: "og:title", content: "Pré-inscription gratuite — Motards de Cœur" },
      {
        property: "og:description",
        content:
          "Motards de Cœur arrive bientôt. Pré-inscription gratuite et sans engagement pour les passionnés de moto.",
      },
      { property: "og:url", content: `${SITE_URL}/join` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/join` }],
  }),
  component: Join,
});

function Join() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback("");

    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    if (!isSupabaseConfigured || !supabase) {
      setStatus("error");
      setFeedback(
        "Le stockage des pré-inscriptions n’est pas encore configuré. Vos informations n’ont pas été envoyées.",
      );
      return;
    }

    const data = new FormData(form);
    setStatus("submitting");
    const { error } = await supabase.from("preinscriptions").insert({
      first_name: String(data.get("first_name") ?? "").trim(),
      email: String(data.get("email") ?? "")
        .trim()
        .toLowerCase(),
      location: String(data.get("location") ?? "").trim() || null,
      rider_profile: String(data.get("rider_profile") ?? "") || null,
      favorite_bike: String(data.get("favorite_bike") ?? "").trim() || null,
      primary_interest: String(data.get("primary_interest") ?? "") || null,
      message: String(data.get("message") ?? "").trim() || null,
      consent_rgpd: data.get("consent_rgpd") === "on",
    });

    if (error) {
      setStatus("error");
      setFeedback(
        error.code === "23505"
          ? "Cette adresse email figure déjà sur la liste de pré-inscription."
          : "Une erreur empêche l’envoi pour le moment. Veuillez réessayer dans quelques instants.",
      );
      return;
    }

    form.reset();
    setStatus("success");
    setFeedback(
      "Merci ! Votre pré-inscription est bien enregistrée. Nous vous préviendrons dès le lancement de Motards de Cœur.",
    );
  }

  const fieldClass =
    "mt-2 w-full rounded-xl border border-white/15 bg-[#302526]/90 px-4 py-3 text-sm text-[#fff9f0] shadow-inner shadow-black/15 outline-none transition placeholder:text-[#cdbdb5] hover:border-[#d6a85c]/35 focus:border-[#e2b45f]/70 focus:bg-[#38292a] focus:ring-2 focus:ring-[#d9a441]/20";

  return (
    <PrelaunchLayout>
      <section className="relative isolate overflow-hidden border-b border-[#8d5b55]/25 bg-[#21191a] px-6 py-16 sm:py-20 lg:py-24">
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
          <img
            src={bikeDetail}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[64%_center] opacity-[0.18] saturate-[0.75] sm:opacity-[0.22] lg:object-[center_38%]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#21191a_0%,rgba(33,25,26,0.88)_38%,rgba(33,25,26,0.7)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(74,24,28,0.5)_0%,rgba(33,25,26,0.1)_36%,#21191a_100%)]" />
          <div className="absolute -left-24 top-12 h-80 w-80 rounded-full bg-[#7b2027]/30 blur-3xl" />
          <div className="absolute -right-28 top-1/3 h-96 w-96 rounded-full bg-[#d0874d]/15 blur-3xl" />
          <div className="absolute bottom-[-18rem] left-[8%] h-[34rem] w-24 rotate-[22deg] border-x border-[#e2b45f]/10 bg-[#d9a441]/[0.025] blur-[0.5px] sm:left-[18%] sm:w-36" />
        </div>
        <div className="relative mx-auto grid max-w-[1380px] gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(560px,1.1fr)] lg:items-start lg:gap-x-16 lg:gap-y-0 xl:gap-x-20">
          <div className="animate-fade-up lg:pt-5">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d9a441]/45 bg-[#d9a441]/15 px-5 py-3 text-sm font-bold uppercase tracking-wider text-[#f6d98d] shadow-[0_0_30px_rgba(217,164,65,0.16)] sm:text-base">
              Pré-inscriptions ouvertes ❤️
            </span>
            <h1 className="font-display text-5xl md:text-7xl leading-none mb-6">
              Motards de Cœur arrive bientôt.
            </h1>
            <p className="mb-5 max-w-2xl text-lg leading-relaxed text-[#d8cbc4]">
              Rejoins gratuitement les premiers membres de Motards de Cœur.
            </p>
            <ul className="mb-8 space-y-2 text-base font-semibold text-[#f1d493] sm:text-lg">
              {["100 % gratuit", "Sans engagement", "Informé(e) en priorité dès l'ouverture"].map(
                (benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <Check className="h-5 w-5 shrink-0 text-[#e2b45f]" strokeWidth={3} />
                    {benefit}
                  </li>
                ),
              )}
            </ul>
            <div className="mb-8 h-px max-w-3xl bg-gradient-to-r from-[#e2b45f]/60 via-[#8d3438]/35 to-transparent" />
          </div>

          <div className="order-3 lg:order-none">
            <div className="grid max-w-3xl gap-3 sm:grid-cols-3">
              {[
                {
                  icon: MapPin,
                  title: "Motards proches",
                  text: "Rencontrer des motards proches de sa région.",
                },
                {
                  icon: Bike,
                  title: "Balades moto",
                  text: "Organiser ou rejoindre des balades moto.",
                },
                {
                  icon: HeartHandshake,
                  title: "Accès prioritaire",
                  text: "Être informé en priorité du lancement.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-[#d6a85c]/20 bg-[#332627]/75 p-5 shadow-[0_12px_35px_rgba(10,4,4,0.22)] backdrop-blur-xl"
                >
                  <item.icon className="mb-3 h-5 w-5 text-[#e2b45f]" />
                  <h2 className="font-display text-xl mb-1">{item.title}</h2>
                  <p className="text-sm leading-relaxed text-[#cdbfba]">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-[#d6a85c]/25 bg-[#552529]/55 p-5 text-sm leading-relaxed text-[#dfcfae] shadow-[0_12px_35px_rgba(10,4,4,0.18)]">
              <div className="mb-2 flex items-center gap-2 text-[#f1d493]">
                <ShieldCheck className="h-4 w-4 text-[#e2b45f]" /> Données protégées
              </div>
              Vos informations servent uniquement à gérer la pré-inscription et à vous informer du
              lancement. Aucun compte, paiement, profil public ou messagerie n'est créé à cette
              étape.
            </div>
          </div>

          <div className="order-2 row-span-2 space-y-6 rounded-3xl border border-[#d6a85c]/25 bg-[#302425]/95 p-5 shadow-[0_28px_80px_rgba(8,3,3,0.48),0_0_70px_rgba(142,40,42,0.14)] backdrop-blur-xl sm:p-7 lg:order-none lg:col-start-2 lg:row-start-1 lg:p-9">
            <div>
              <span className="text-xs uppercase tracking-[0.35em] text-[#e8be6c]">
                Gratuit · Sans engagement
              </span>
              <h2 className="font-display text-3xl mt-3 mb-3">Je me pré-inscris gratuitement</h2>
              <p className="text-sm leading-relaxed text-[#d4c6bf]">
                Dites-nous-en un peu plus sur vous. Les champs marqués d’un astérisque sont
                obligatoires.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-medium">
                  Prénom *
                  <input
                    className={fieldClass}
                    name="first_name"
                    type="text"
                    autoComplete="given-name"
                    required
                    maxLength={80}
                  />
                </label>
                <label className="text-sm font-medium">
                  Email *
                  <input
                    className={fieldClass}
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                  />
                </label>
              </div>
              <label className="block text-sm font-medium">
                Ville / région
                <input
                  className={fieldClass}
                  name="location"
                  type="text"
                  autoComplete="address-level2"
                  maxLength={120}
                />
              </label>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-medium">
                  Tu es
                  <select className={fieldClass} name="rider_profile" defaultValue="">
                    <option value="">Sélectionner</option>
                    {riderOptions.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium">
                  Type de moto ou moto préférée
                  <input className={fieldClass} name="favorite_bike" type="text" maxLength={120} />
                </label>
              </div>
              <label className="block text-sm font-medium">
                Tu recherches principalement
                <select className={fieldClass} name="primary_interest" defaultValue="">
                  <option value="">Sélectionner</option>
                  {searchOptions.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium">
                Message libre
                <textarea
                  className={`${fieldClass} min-h-32 resize-y`}
                  name="message"
                  maxLength={1000}
                />
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#d6a85c]/20 bg-[#281e1f]/70 p-4 text-sm leading-relaxed text-[#d4c6bf]">
                <input
                  className="mt-1 h-4 w-4 accent-primary"
                  name="consent_rgpd"
                  type="checkbox"
                  required
                />
                <span>
                  J’accepte que mes données soient utilisées pour gérer ma pré-inscription et
                  m’informer du lancement de Motards de Cœur. *{" "}
                  <Link to="/confidentialite" className="text-primary hover:underline">
                    Politique de confidentialité
                  </Link>
                </span>
              </label>
              <button
                disabled={status === "submitting"}
                className="w-full rounded-full bg-gradient-red px-8 py-4 text-sm font-medium uppercase tracking-wider text-primary-foreground shadow-glow transition-all hover:scale-[1.01] disabled:cursor-wait disabled:opacity-60"
                type="submit"
              >
                {status === "submitting" ? "Envoi en cours…" : "Valider ma pré-inscription"}
              </button>
              <p className="flex items-center justify-center gap-2 text-center text-xs text-[#e4c986] sm:text-sm">
                <ShieldCheck className="h-4 w-4 shrink-0 text-[#e2b45f]" />
                Aucun paiement — gratuit et sans engagement.
              </p>
              <p className="text-center text-xs leading-relaxed text-[#cdbfba]">
                Vos données restent confidentielles et servent uniquement à vous informer du
                lancement.
              </p>
              {feedback && (
                <div
                  role="status"
                  className={`flex items-start gap-3 rounded-xl border p-4 text-sm leading-relaxed ${status === "success" ? "border-green-500/40 bg-green-500/10 text-green-200" : "border-primary/40 bg-primary/10 text-foreground"}`}
                >
                  {status === "success" && <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />}
                  <span>{feedback}</span>
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      <section className="border-t border-white/[0.03] bg-gradient-to-b from-[#241b1c] to-[#191516] px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl text-center">
          <Mail className="mx-auto h-8 w-8 text-primary mb-5" />
          <h2 className="font-display text-4xl md:text-5xl mb-4">
            Une première liste d'attente, avant la vraie application.
          </h2>
          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-[#cdbfba]">
            Cette étape prépare le lancement avec une collecte simple et consentie. Les comptes
            utilisateurs, profils, likes, messagerie et offres premium viendront plus tard.
          </p>
        </div>
      </section>
    </PrelaunchLayout>
  );
}

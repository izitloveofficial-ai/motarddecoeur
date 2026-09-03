import { Link, createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { Layout } from "@/components/Layout";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { Bike, CheckCircle2, Clock, HeartHandshake, Mail, MapPin, ShieldCheck } from "lucide-react";

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
      "Merci, votre pré-inscription est bien enregistrée. Vous serez informé dès l’ouverture de Motards de Cœur.",
    );
  }

  const fieldClass =
    "mt-2 w-full rounded-xl border border-border bg-background/70 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25";

  return (
    <Layout>
      <section className="py-20 px-6 border-b border-border/40">
        <div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:items-start">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 glass-red px-4 py-2 rounded-full text-xs uppercase tracking-widest mb-6">
              <Clock className="h-3 w-3" /> Pré-inscription gratuite
            </span>
            <h1 className="font-display text-5xl md:text-7xl leading-none mb-6">
              Soyez parmi les premiers motards inscrits.
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mb-5">
              Motards de Cœur arrive bientôt. Pré-inscrivez-vous gratuitement pour découvrir les
              futures rencontres entre motards, balades et la communauté moto.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mb-8">
              Quelques instants suffisent. Vous serez informé dès l'ouverture des fonctionnalités.
            </p>
            <div className="grid gap-4 sm:grid-cols-3 max-w-3xl">
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
                <div key={item.title} className="glass rounded-2xl p-5">
                  <item.icon className="h-5 w-5 text-primary mb-3" />
                  <h2 className="font-display text-xl mb-1">{item.title}</h2>
                  <p className="text-sm text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-primary/30 bg-primary/10 p-5 text-sm text-muted-foreground leading-relaxed">
              <div className="mb-2 flex items-center gap-2 text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" /> Données protégées
              </div>
              Vos informations servent uniquement à gérer la pré-inscription et à vous informer du
              lancement. Aucun compte, paiement, profil public ou messagerie n'est créé à cette
              étape.
            </div>
          </div>

          <div className="glass space-y-6 rounded-3xl p-5 sm:p-7 lg:p-9">
            <div>
              <span className="text-primary uppercase tracking-[0.35em] text-xs">
                Gratuit · Sans engagement
              </span>
              <h2 className="font-display text-3xl mt-3 mb-3">
                Je rejoins la liste de pré-inscription
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
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
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background/40 p-4 text-sm text-muted-foreground">
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

      <section className="py-20 px-6">
        <div className="mx-auto max-w-5xl text-center">
          <Mail className="mx-auto h-8 w-8 text-primary mb-5" />
          <h2 className="font-display text-4xl md:text-5xl mb-4">
            Une première liste d'attente, avant la vraie application.
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-3xl mx-auto">
            Cette étape prépare le lancement avec une collecte simple et consentie. Les comptes
            utilisateurs, profils, likes, messagerie et offres premium viendront plus tard.
          </p>
        </div>
      </section>
    </Layout>
  );
}

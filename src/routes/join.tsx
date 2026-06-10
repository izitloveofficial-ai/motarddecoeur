import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Layout } from "@/components/Layout";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { Bike, CheckCircle2, Clock, HeartHandshake, Mail, MapPin, Send } from "lucide-react";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "Pré-inscription — Motard de Cœur" },
      { name: "description", content: "Inscrivez-vous pour être prévenu du lancement de Motard de Cœur : rencontres, balades, événements et affinités entre passionnés de moto." },
      { property: "og:title", content: "Pré-inscription — Motard de Cœur" },
      { property: "og:description", content: "La communauté Motard de Cœur ouvre bientôt. Soyez prévenu du lancement." },
      { property: "og:url", content: "/join" },
    ],
    links: [{ rel: "canonical", href: "/join" }],
  }),
  component: Join,
});

const sexOptions = [
  { value: "", label: "Sélectionner" },
  { value: "femme", label: "Femme" },
  { value: "homme", label: "Homme" },
  { value: "non_binaire", label: "Non-binaire" },
  { value: "prefere_ne_pas_dire", label: "Je préfère ne pas dire" },
  { value: "autre", label: "Autre" },
];

const rideTypes = ["", "Permis en cours", "125 cc", "Roadster", "Custom", "Sportive", "Touring", "Trail", "Autre"];

const preinscriptionSchema = z.object({
  first_name: z.string().trim().min(2, "Indiquez au moins 2 caractères.").max(80, "Prénom trop long."),
  email: z.string().trim().email("Indiquez une adresse email valide.").max(254, "Email trop long.").transform((value) => value.toLowerCase()),
  city: z.string().trim().min(2, "Indiquez votre ville ou région.").max(120, "Ville ou région trop longue."),
  age: z.coerce.number({ invalid_type_error: "Indiquez votre âge." }).int("Indiquez un âge entier.").min(18, "La pré-inscription est réservée aux personnes majeures.").max(99, "Indiquez un âge valide."),
  sex: z.enum(["femme", "homme", "non_binaire", "prefere_ne_pas_dire", "autre"], {
    required_error: "Choisissez une option.",
    invalid_type_error: "Choisissez une option.",
  }),
  bike_type: z.string().trim().min(2, "Indiquez votre type de moto ou permis.").max(120, "Texte trop long."),
  message: z.string().trim().max(1000, "Message trop long.").optional().transform((value) => value || null),
  consent_rgpd: z.boolean().refine((value) => value, "Le consentement est nécessaire pour vous recontacter."),
});

type PreinscriptionForm = z.infer<typeof preinscriptionSchema>;
type FormErrors = Partial<Record<keyof PreinscriptionForm, string>>;
type SubmitStatus = { type: "idle" | "success" | "error"; message: string };

const getField = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim();

function Join() {
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<SubmitStatus>({ type: "idle", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isSupabaseConfigured || !supabase) {
      setStatus({
        type: "error",
        message: "La pré-inscription sera active dès que Supabase sera configuré dans Lovable.",
      });
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const parsed = preinscriptionSchema.safeParse({
      first_name: getField(formData, "first_name"),
      email: getField(formData, "email"),
      city: getField(formData, "city"),
      age: getField(formData, "age"),
      sex: getField(formData, "sex"),
      bike_type: getField(formData, "bike_type"),
      message: getField(formData, "message"),
      consent_rgpd: formData.get("consent_rgpd") === "on",
    });

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({
        first_name: fieldErrors.first_name?.[0],
        email: fieldErrors.email?.[0],
        city: fieldErrors.city?.[0],
        age: fieldErrors.age?.[0],
        sex: fieldErrors.sex?.[0],
        bike_type: fieldErrors.bike_type?.[0],
        message: fieldErrors.message?.[0],
        consent_rgpd: fieldErrors.consent_rgpd?.[0],
      });
      setStatus({ type: "error", message: "Vérifiez les champs indiqués avant d'envoyer votre pré-inscription." });
      return;
    }

    setErrors({});
    setStatus({ type: "idle", message: "" });
    setIsSubmitting(true);

    const { error } = await supabase.from("preinscriptions").insert(parsed.data);

    setIsSubmitting(false);

    if (error) {
      if (error.code === "23505") {
        setStatus({ type: "success", message: "Cette adresse email est déjà pré-inscrite. Merci, vous êtes bien dans la liste." });
        form.reset();
        return;
      }

      setStatus({ type: "error", message: "L'envoi n'a pas abouti. Réessayez dans quelques instants." });
      return;
    }

    setStatus({ type: "success", message: "Pré-inscription confirmée. Vous serez prévenu au lancement de Motard de Cœur." });
    form.reset();
  };

  return (
    <Layout>
      <section className="py-20 px-6 border-b border-border/40">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 glass-red px-4 py-2 rounded-full text-xs uppercase tracking-widest mb-6">
              <Clock className="h-3 w-3" /> Ouverture prochaine
            </span>
            <h1 className="font-display text-5xl md:text-7xl leading-none mb-6">
              La communauté <span className="text-gradient-red italic">Motard de Cœur</span> ouvre bientôt.
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mb-8">
              Rencontres, balades, événements et affinités entre passionnés de moto.
              Inscris-toi pour être prévenu du lancement et faire partie des premiers membres.
            </p>
            <div className="grid gap-4 sm:grid-cols-3 max-w-3xl">
              {[
                { icon: HeartHandshake, title: "Rencontres", text: "Des affinités entre passionnés." },
                { icon: Bike, title: "Balades", text: "Des rides et sorties locales." },
                { icon: MapPin, title: "Événements", text: "Des rendez-vous biker à venir." },
              ].map((item) => (
                <div key={item.title} className="glass rounded-2xl p-5">
                  <item.icon className="h-5 w-5 text-primary mb-3" />
                  <h2 className="font-display text-xl mb-1">{item.title}</h2>
                  <p className="text-sm text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <form className="glass rounded-3xl p-6 md:p-10 space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <span className="text-primary uppercase tracking-[0.35em] text-xs">Pré-inscription</span>
              <h2 className="font-display text-3xl mt-3 mb-3">Soyez prévenu du lancement</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Remplissez ce formulaire pour rejoindre la première liste d'attente Motard de Cœur.
                Aucun compte, aucun paiement et aucune messagerie ne sont créés à cette étape.
              </p>
            </div>

            {!isSupabaseConfigured && (
              <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm text-muted-foreground">
                La connexion Supabase doit encore être configurée dans Lovable avant de recevoir les pré-inscriptions.
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <FieldError label="Prénom" htmlFor="join-firstname" error={errors.first_name}>
                <input id="join-firstname" name="first_name" placeholder="Ex. Camille" className="w-full px-4 py-3 bg-input/40 border border-border rounded-lg focus:outline-none focus:border-primary" />
              </FieldError>
              <FieldError label="Email" htmlFor="join-email" error={errors.email}>
                <input id="join-email" name="email" type="email" placeholder="camille@email.fr" className="w-full px-4 py-3 bg-input/40 border border-border rounded-lg focus:outline-none focus:border-primary" />
              </FieldError>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <FieldError label="Ville ou région" htmlFor="join-city" error={errors.city}>
                <input id="join-city" name="city" placeholder="Ex. Lyon, Alpes, Côte d'Azur" className="w-full px-4 py-3 bg-input/40 border border-border rounded-lg focus:outline-none focus:border-primary" />
              </FieldError>
              <FieldError label="Âge" htmlFor="join-age" error={errors.age}>
                <input id="join-age" name="age" type="number" min="18" max="99" placeholder="Ex. 34" className="w-full px-4 py-3 bg-input/40 border border-border rounded-lg focus:outline-none focus:border-primary" />
              </FieldError>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <FieldError label="Sexe" htmlFor="join-sex" error={errors.sex}>
                <select id="join-sex" name="sex" className="w-full px-4 py-3 bg-input/40 border border-border rounded-lg focus:outline-none focus:border-primary">
                  {sexOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </FieldError>
              <FieldError label="Type de moto ou permis" htmlFor="join-bike" error={errors.bike_type}>
                <select id="join-bike" name="bike_type" className="w-full px-4 py-3 bg-input/40 border border-border rounded-lg focus:outline-none focus:border-primary">
                  {rideTypes.map((type) => <option key={type} value={type}>{type || "Sélectionner"}</option>)}
                </select>
              </FieldError>
            </div>

            <FieldError label="Message facultatif" htmlFor="join-message" error={errors.message}>
              <textarea id="join-message" name="message" rows={4} placeholder="Une envie de balade, une région, une attente particulière..." className="w-full resize-none px-4 py-3 bg-input/40 border border-border rounded-lg focus:outline-none focus:border-primary" />
            </FieldError>

            <div>
              <label className="flex items-start gap-3 rounded-xl border border-border bg-input/30 p-4 text-sm text-muted-foreground">
                <input type="checkbox" name="consent_rgpd" className="mt-1 accent-primary" />
                <span>J'accepte que Motard de Cœur conserve ces informations pour me recontacter au sujet du lancement.</span>
              </label>
              {errors.consent_rgpd && <p className="mt-2 text-sm text-primary">{errors.consent_rgpd}</p>}
            </div>

            {status.type !== "idle" && (
              <div className={`rounded-xl border p-4 text-sm ${status.type === "success" ? "border-primary/40 bg-primary/10 text-foreground" : "border-destructive/40 bg-destructive/10 text-muted-foreground"}`}>
                {status.message}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-red text-primary-foreground rounded-full uppercase tracking-wider text-sm font-medium shadow-glow hover:scale-105 disabled:cursor-not-allowed disabled:opacity-70 transition-all">
                {isSubmitting ? "Envoi en cours" : "Valider ma pré-inscription"} <Send className="h-4 w-4" />
              </button>
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Aucun compte ni paiement requis.
              </span>
            </div>
          </form>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="mx-auto max-w-5xl text-center">
          <Mail className="mx-auto h-8 w-8 text-primary mb-5" />
          <h2 className="font-display text-4xl md:text-5xl mb-4">Une première liste d'attente, avant la vraie application.</h2>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-3xl mx-auto">
            Cette étape prépare le lancement avec une collecte simple et consentie.
            Les comptes utilisateurs, profils, likes, messagerie et offres premium viendront plus tard.
          </p>
        </div>
      </section>
    </Layout>
  );
}

function FieldError({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">{label}</label>
      {children}
      {error && <p className="mt-2 text-sm text-primary">{error}</p>}
    </div>
  );
}

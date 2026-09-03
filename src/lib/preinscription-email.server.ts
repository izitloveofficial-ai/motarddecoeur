import { getServerConfig } from "./config.server";

export type PreinscriptionNotification = {
  firstName: string;
  email: string;
  location?: string;
  riderProfile?: string;
  favoriteBike?: string;
  primaryInterest?: string;
  message?: string;
};

const riderProfiles: Record<string, string> = {
  motard: "Motard",
  motarde: "Motarde",
  passager_passagere: "Passager / passagère",
  passionne_moto: "Passionné(e) de moto",
  permis_en_cours: "Permis en cours",
};

const interests: Record<string, string> = {
  rencontre_serieuse: "Une rencontre sérieuse",
  balades_moto: "Des balades moto",
  amitie: "De l’amitié",
  communaute_motards: "Une communauté de motards",
  indecis: "Je ne sais pas encore",
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function display(value: string | undefined, labels?: Record<string, string>) {
  if (!value) return "Non renseigné";
  return labels?.[value] ?? value;
}

export async function sendPreinscriptionNotification(data: PreinscriptionNotification) {
  const config = getServerConfig();
  const apiKey = config.resendApiKey;
  const to = config.preinscriptionNotificationTo ?? "contact@motardsdecoeur.com";
  const from = config.preinscriptionNotificationFrom;

  if (!apiKey || !from) {
    console.warn(
      "Notification de pré-inscription ignorée : RESEND_API_KEY ou PREINSCRIPTION_NOTIFICATION_FROM manquant.",
    );
    return { delivered: false as const, reason: "not_configured" as const };
  }

  const fields = [
    ["Prénom", data.firstName],
    ["Email", data.email],
    ["Ville / région", display(data.location)],
    ["Profil", display(data.riderProfile, riderProfiles)],
    ["Moto préférée", display(data.favoriteBike)],
    ["Recherche", display(data.primaryInterest, interests)],
    ["Message", display(data.message)],
  ];
  const text = fields.map(([label, value]) => `${label} : ${value}`).join("\n");
  const html = `<h1>Nouvelle pré-inscription</h1>${fields
    .map(([label, value]) => `<p><strong>${escapeHtml(label)}</strong> : ${escapeHtml(value)}</p>`)
    .join("")}`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: data.email,
      subject: `Nouvelle pré-inscription — ${data.firstName}`,
      text,
      html,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Resend a refusé la notification (${response.status}): ${await response.text()}`,
    );
  }

  return { delivered: true as const };
}

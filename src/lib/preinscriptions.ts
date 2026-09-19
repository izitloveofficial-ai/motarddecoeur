import { z } from "zod";

export const PREINSCRIPTION_MESSAGES = {
  success:
    "Votre préinscription est confirmée. Merci ! Vous serez informé(e) en priorité lors du lancement de Motards de Cœur.",
  duplicate: "Cette adresse est déjà préinscrite. Vous serez informé(e) du lancement.",
  error:
    "Nous n’avons pas pu enregistrer votre préinscription. Veuillez réessayer dans quelques instants.",
} as const;

const optionalText = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .optional()
    .transform((value) => value || null);

export const preinscriptionSchema = z
  .object({
    first_name: z.string().trim().min(1).max(80),
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((value) => value.toLowerCase()),
    location: optionalText(120),
    rider_profile: optionalText(40),
    favorite_bike: optionalText(120),
    primary_interest: optionalText(40),
    message: optionalText(1000),
    consent_rgpd: z.literal(true),
    website: z.string().max(0).optional().default(""),
  })
  .strict();

export type PreinscriptionInput = z.infer<typeof preinscriptionSchema>;

export type PreinscriptionStore = {
  create(input: Omit<PreinscriptionInput, "website">): Promise<"created" | "duplicate">;
};

export async function submitPreinscription(
  raw: unknown,
  store: PreinscriptionStore,
): Promise<{ status: number; body: { ok: boolean; duplicate?: boolean; message: string } }> {
  const parsed = preinscriptionSchema.safeParse(raw);
  if (!parsed.success)
    return { status: 400, body: { ok: false, message: PREINSCRIPTION_MESSAGES.error } };
  const { website: _honeypot, ...input } = parsed.data;
  const result = await store.create(input);
  const duplicate = result === "duplicate";
  return {
    status: duplicate ? 200 : 201,
    body: {
      ok: true,
      duplicate,
      message: duplicate ? PREINSCRIPTION_MESSAGES.duplicate : PREINSCRIPTION_MESSAGES.success,
    },
  };
}

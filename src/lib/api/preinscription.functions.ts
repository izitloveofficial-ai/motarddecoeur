import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional();

const notificationSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(254),
  location: optionalText(120),
  riderProfile: optionalText(40),
  favoriteBike: optionalText(120),
  primaryInterest: optionalText(40),
  message: optionalText(1000),
});

export const notifyPreinscription = createServerFn({ method: "POST" })
  .validator(notificationSchema)
  .handler(async ({ data }) => {
    try {
      const { sendPreinscriptionNotification } = await import("../preinscription-email.server");
      return await sendPreinscriptionNotification(data);
    } catch (error) {
      // Email is deliberately best-effort: the Supabase insert has already succeeded.
      console.error("Échec de la notification email de pré-inscription", error);
      return { delivered: false as const, reason: "delivery_failed" as const };
    }
  });

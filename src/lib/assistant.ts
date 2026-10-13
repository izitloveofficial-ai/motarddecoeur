import { supabase } from "./supabase";

export type AssistantMessage = { role: "user" | "assistant"; content: string };

export const ASSISTANT_MAX_CHARS = 800;

const ERROR_MESSAGES: Record<string, string> = {
  too_many_requests: "Doucement, motard ! Patiente une seconde avant ta prochaine question.",
  authentication_required: "Connecte-toi pour discuter avec l'assistant.",
};
const DEFAULT_ERROR =
  "L'assistant est momentanément indisponible. Réessaie dans un instant ou passe par la page Contact.";

/** Envoie la conversation à l'assistant et renvoie sa réponse, ou lève une erreur lisible. */
export async function askAssistant(messages: AssistantMessage[]): Promise<string> {
  if (!supabase) throw new Error(DEFAULT_ERROR);
  const { data, error } = await supabase.functions.invoke("ai-assistant", {
    body: { messages },
  });
  if (error) {
    let code = "";
    try {
      const payload = await (error as { context?: Response }).context?.json();
      code = payload?.error ?? "";
    } catch {
      // réponse illisible : message générique
    }
    throw new Error(ERROR_MESSAGES[code] ?? DEFAULT_ERROR);
  }
  const reply = typeof data?.reply === "string" ? data.reply.trim() : "";
  if (!reply) throw new Error(DEFAULT_ERROR);
  return reply;
}

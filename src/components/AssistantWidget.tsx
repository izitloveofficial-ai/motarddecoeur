import { type FormEvent, useEffect, useRef, useState } from "react";
import { askAssistant, ASSISTANT_MAX_CHARS, type AssistantMessage } from "@/lib/assistant";
import { supabase } from "@/lib/supabase";

const WELCOME: AssistantMessage = {
  role: "assistant",
  content:
    "Salut ! Je suis Moto Pote, l'assistant de Motards de Cœur. Pose-moi une question sur l'appli, ton profil ou une idée de premier message.",
};
const SUGGESTIONS = [
  "Comment compléter mon profil ?",
  "Idée de premier message",
  "Conseils pour une première rencontre",
];

/** Assistant IA flottant, réservé aux membres connectés. */
export function AssistantWidget() {
  const [signedIn, setSignedIn] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([WELCOME]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session));
      if (!session) {
        setOpen(false);
        setMessages([WELCOME]);
        setError("");
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!signedIn) return null;

  async function send(text: string) {
    const content = text.trim().slice(0, ASSISTANT_MAX_CHARS);
    if (!content || loading) return;
    const next = [...messages, { role: "user", content } as AssistantMessage];
    setMessages(next);
    setDraft("");
    setError("");
    setLoading(true);
    try {
      // Le message d'accueil n'est pas envoyé : la conversation doit commencer par l'utilisateur.
      const reply = await askAssistant(next.filter((message) => message !== WELCOME));
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void send(draft);
  }

  return (
    <div className="fixed bottom-24 right-4 z-[60] sm:bottom-6 sm:right-6">
      {open && (
        <section
          role="dialog"
          aria-label="Assistant Motards de Cœur"
          className="glass mb-3 flex h-[min(32rem,70vh)] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-primary/30 bg-background/95 shadow-2xl animate-in fade-in-0 zoom-in-95"
        >
          <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <p className="font-display text-lg leading-none">Moto Pote</p>
              <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                Assistant IA · peut se tromper
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer l'assistant"
              className="rounded-full px-2 py-1 text-xl leading-none text-muted-foreground transition hover:text-foreground"
            >
              ×
            </button>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm" aria-live="polite">
            {messages.map((message, index) => (
              <div
                key={index}
                className={
                  message.role === "user"
                    ? "ml-8 rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-primary-foreground"
                    : "mr-8 rounded-2xl rounded-bl-sm bg-card px-3 py-2"
                }
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            ))}
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => void send(suggestion)}
                    className="rounded-full border border-primary/40 px-3 py-1 text-xs transition hover:bg-primary/20"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            {loading && (
              <p className="mr-8 rounded-2xl bg-card px-3 py-2 text-muted-foreground" role="status">
                Moto Pote réfléchit…
              </p>
            )}
            {error && (
              <p
                className="rounded-xl border border-destructive/40 px-3 py-2 text-destructive"
                role="alert"
              >
                {error}
              </p>
            )}
            <div ref={endRef} />
          </div>
          <form onSubmit={onSubmit} className="flex gap-2 border-t border-white/10 p-3">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={ASSISTANT_MAX_CHARS}
              placeholder="Ta question…"
              aria-label="Ta question à l'assistant"
              className="min-w-0 flex-1 rounded-full border bg-card px-4 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={loading || !draft.trim()}
              className="rounded-full bg-gradient-red px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              Envoyer
            </button>
          </form>
        </section>
      )}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? "Fermer l'assistant" : "Ouvrir l'assistant"}
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-red text-xl font-bold text-primary-foreground shadow-glow transition hover:scale-105"
      >
        {open ? "×" : "?"}
      </button>
    </div>
  );
}

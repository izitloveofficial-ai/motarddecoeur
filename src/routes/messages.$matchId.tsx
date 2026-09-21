import { Link, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Send, ShieldOff, Trash2 } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Layout } from "@/components/Layout";
import { ProfilePhotoGallery, type GalleryProfile } from "@/components/ProfilePhotoGallery";
import { requireAdmin } from "@/lib/require-admin";
import { sendPushNotification } from "@/lib/push";
import { supabase } from "@/lib/supabase";

type Message = { id: string; sender_id: string; content: string; created_at: string };
export const Route = createFileRoute("/messages/$matchId")({
  // Supabase persists auth in browser storage, so authorization must run in the browser.
  ssr: false,
  component: Conversation,
  beforeLoad: async () => {
    await requireAdmin();
    if (!supabase) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/login" });
  },
});
function Conversation() {
  const { matchId } = Route.useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherName, setOtherName] = useState("");
  const [otherPhotoUrl, setOtherPhotoUrl] = useState<string | null>(null);
  const [otherPhotos, setOtherPhotos] = useState<string[]>([]);
  const [otherProfile, setOtherProfile] = useState<GalleryProfile>({ firstName: "Motard(e)" });
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [content, setContent] = useState("");
  const [myId, setMyId] = useState<string | null>(null);
  const [otherId, setOtherId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const closeGallery = useCallback(() => setGalleryOpen(false), []);
  useEffect(() => {
    if (!supabase) {
      setError("Supabase n'est pas configuré.");
      return;
    }
    const client = supabase;
    let cancelled = false;
    let channel: ReturnType<typeof client.channel> | null = null;
    async function init() {
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user || cancelled) return;

      setMyId(user.id);
      const { data: match, error: matchError } = await client
        .from("matches")
        .select("profile_a_id, profile_b_id")
        .eq("id", matchId)
        .maybeSingle();
      if (cancelled) return;
      if (
        matchError ||
        !match ||
        (match.profile_a_id !== user.id && match.profile_b_id !== user.id)
      ) {
        setError("Cette conversation n'existe pas ou tu n'y as pas accès.");
        return;
      }
      const otherId = match.profile_a_id === user.id ? match.profile_b_id : match.profile_a_id;
      setOtherId(otherId);

      channel = client
        .channel(`messages:${matchId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `match_id=eq.${matchId}`,
          },
          (payload) => {
            const incoming = payload.new as Message;
            setMessages((previous) =>
              previous.some((message) => message.id === incoming.id)
                ? previous
                : [...previous, incoming],
            );
            if (incoming.sender_id !== user.id) {
              void client
                .from("messages")
                .update({ read_at: new Date().toISOString() })
                .eq("id", incoming.id);
            }
          },
        )
        .subscribe();

      const [
        { data: profile },
        { data: photos },
        { data: promptAnswers },
        { data: existing, error: messagesError },
      ] = await Promise.all([
        client
          .from("profiles")
          .select("first_name, bio, moto_brand, moto_model")
          .eq("id", otherId)
          .maybeSingle(),
        client
          .from("profile_photos")
          .select("storage_path")
          .eq("profile_id", otherId)
          .order("position", { ascending: true }),
        client
          .from("profile_prompts")
          .select("answer, position, prompts(question)")
          .eq("profile_id", otherId)
          .order("position", { ascending: true }),
        client
          .from("messages")
          .select("id, sender_id, content, created_at")
          .eq("match_id", matchId)
          .order("created_at", { ascending: true }),
      ]);
      if (!cancelled) {
        const firstName = profile?.first_name ?? "Motard(e)";
        const photoUrls = (photos ?? []).map(
          (photo) =>
            client.storage.from("profile-photos").getPublicUrl(photo.storage_path).data.publicUrl,
        );
        setOtherName(firstName);
        setOtherProfile({
          firstName,
          bio: profile?.bio,
          motoBrand: profile?.moto_brand,
          motoModel: profile?.moto_model,
          prompts: (promptAnswers ?? []).flatMap((item) => {
            const prompt = item.prompts as unknown as { question: string } | null;
            return prompt?.question ? [{ question: prompt.question, answer: item.answer }] : [];
          }),
        });
        setOtherPhotos(photoUrls);
        setOtherPhotoUrl(photoUrls[0] ?? null);
        // An INSERT can arrive while the initial query is in flight. Merge both sources so the
        // query cannot overwrite a realtime message (and keep the conversation chronological).
        setMessages((realtimeMessages) => {
          const byId = new Map(
            [...(existing ?? []), ...realtimeMessages].map((message) => [message.id, message]),
          );
          return [...byId.values()].sort(
            (first, second) =>
              new Date(first.created_at).getTime() - new Date(second.created_at).getTime(),
          );
        });
        if (messagesError) setError("Impossible de charger les messages.");
        await client
          .from("messages")
          .update({ read_at: new Date().toISOString() })
          .eq("match_id", matchId)
          .eq("sender_id", otherId)
          .is("read_at", null);
      }
    }
    void init();
    return () => {
      cancelled = true;
      if (channel) void client.removeChannel(channel);
    };
  }, [matchId]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  async function send(event: FormEvent) {
    event.preventDefault();
    if (!supabase || !myId || !content.trim()) return;
    const text = content.trim();
    setContent("");
    setError("");
    const { data: sentMessage, error: sendError } = await supabase
      .from("messages")
      .insert({ match_id: matchId, sender_id: myId, content: text })
      .select("id, sender_id, content, created_at")
      .single();
    if (sendError) {
      setContent(text);
      setError(
        sendError.message?.includes("rate_limit_exceeded")
          ? "Tu envoies des messages trop vite, patiente un instant."
          : sendError.message?.includes("contenu_interdit")
            ? "Ce message contient un terme non autorisé, merci de le reformuler."
            : "Le message n'a pas pu être envoyé.",
      );
      return;
    }
    // Do not depend on the realtime round trip to show a message just sent. The subscription
    // uses the same id and will therefore be ignored when it arrives a moment later.
    setMessages((previous) =>
      previous.some((message) => message.id === sentMessage.id)
        ? previous
        : [...previous, sentMessage],
    );
    if (otherId) {
      void sendPushNotification(
        otherId,
        "Nouveau message sur Motards de Cœur",
        text.length > 80 ? `${text.slice(0, 80)}…` : text,
      );
    }
  }
  async function blockOther() {
    if (!supabase || !myId || !otherId) return;
    if (
      !window.confirm(
        `Bloquer ${otherName || "cette personne"} ? Vous ne pourrez plus vous écrire.`,
      )
    )
      return;
    const { error: blockError } = await supabase
      .from("blocks")
      .insert({ blocker_id: myId, blocked_id: otherId });
    if (blockError) {
      setError("Le blocage n'a pas pu être enregistré.");
      return;
    }
    void navigate({ to: "/matches" });
  }

  async function deleteConversation() {
    if (!supabase) return;
    if (
      !window.confirm(
        "Supprimer cette conversation ? Tous les messages seront définitivement effacés pour les deux personnes.",
      )
    )
      return;
    await supabase.from("matches").delete().eq("id", matchId);
    void navigate({ to: "/matches" });
  }

  return (
    <Layout>
      <div className="min-h-[calc(100vh-7rem)] bg-[#21191a] text-[#fff9f0]">
        <section className="mx-auto flex h-[calc(100vh-8rem)] max-w-2xl flex-col px-4 py-5 sm:px-6 sm:py-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Link
                to="/matches"
                aria-label="Retour aux coups de cœur"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 text-[#d4c6bf]"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => setGalleryOpen(true)}
                aria-label={`Voir le profil et les photos de ${otherName || "cette personne"}`}
                className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#d6a85c]/25 bg-[#302526] text-sm font-medium text-[#d4c6bf] shadow-md ring-1 ring-white/10 transition hover:ring-[#d6a85c]"
              >
                {otherPhotoUrl ? (
                  <img
                    src={otherPhotoUrl}
                    alt={otherName || "Photo de l'interlocuteur"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span aria-hidden="true">
                    {otherName ? otherName.charAt(0).toUpperCase() : ""}
                  </span>
                )}
              </button>
              <button type="button" onClick={() => setGalleryOpen(true)} className="text-left">
                <h1 className="font-display text-xl sm:text-2xl">{otherName || "Conversation"}</h1>
                <span className="text-xs text-[#a99b95]">Voir le profil</span>
              </button>
            </div>
            <div className="flex w-full items-center justify-end gap-2 sm:w-auto sm:gap-4">
              <button
                onClick={() => void deleteConversation()}
                className="flex min-h-11 items-center gap-1.5 px-2 text-xs text-[#a99b95] hover:text-[#e8be6c]"
              >
                <Trash2 className="h-3.5 w-3.5" /> Supprimer
              </button>
              <button
                onClick={() => void blockOther()}
                className="flex min-h-11 items-center gap-1.5 px-2 text-xs text-[#a99b95] hover:text-[#e8be6c]"
              >
                <ShieldOff className="h-3.5 w-3.5" /> Bloquer
              </button>
            </div>
          </div>
          {error && (
            <div
              role="alert"
              className="mb-4 rounded-xl border border-primary/40 bg-primary/10 p-4 text-sm"
            >
              {error}
            </div>
          )}
          <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-[#d6a85c]/25 bg-[#302425]/95 p-4">
            {messages.map((message) => {
              // Derive both alignment and colors from the same reactive identity. Unlike a ref,
              // myId triggers a render as soon as authentication resolves and stays authoritative
              // for historical, realtime, and newly inserted messages alike.
              const isMine = message.sender_id === myId;
              return (
                <div
                  key={message.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${isMine ? "bg-neutral-900 text-white" : "bg-[var(--ember)] text-white"}`}
                  >
                    {message.content}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={send} className="mt-4 flex gap-2">
            <input
              aria-label="Message"
              className="flex-1 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-[#e2b45f]/70"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Écris un message…"
              maxLength={2000}
            />
            <button
              type="submit"
              disabled={!content.trim()}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-red text-primary-foreground disabled:opacity-50"
              aria-label="Envoyer"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </section>
      </div>
      <ProfilePhotoGallery
        open={galleryOpen}
        onClose={closeGallery}
        photos={otherPhotos}
        profile={otherProfile}
      />
    </Layout>
  );
}

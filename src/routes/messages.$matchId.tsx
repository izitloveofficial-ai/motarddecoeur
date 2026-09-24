import { Link, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Copy,
  Send,
  Share2,
  Shield,
  ShieldOff,
  Trash2,
} from "lucide-react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Layout } from "@/components/Layout";
import { ProfilePhotoGallery, type GalleryProfile } from "@/components/ProfilePhotoGallery";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { requireAppAccess } from "@/lib/require-admin";
import { mergeMessages } from "@/lib/message-sync";
import { sendPushNotification } from "@/lib/push";
import { supabase } from "@/lib/supabase";

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
};
export const Route = createFileRoute("/messages/$matchId")({
  // Supabase persists auth in browser storage, so authorization must run in the browser.
  ssr: false,
  component: Conversation,
  errorComponent: ConversationError,
  beforeLoad: async () => {
    await requireAppAccess();
    if (!supabase) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/login" });
  },
});

function ConversationError({ error }: { error: Error }) {
  console.error("conversation rendering failed", error);

  return (
    <Layout>
      <main className="flex min-h-[calc(100vh-7rem)] items-center justify-center bg-[#21191a] px-6 text-[#fff9f0]">
        <div className="max-w-md rounded-2xl border border-[#d6a85c]/25 bg-[#302425] p-8 text-center shadow-xl">
          <AlertTriangle className="mx-auto h-12 w-12 text-[#e8be6c]" aria-hidden="true" />
          <h1 className="mt-5 font-display text-2xl">Conversation indisponible</h1>
          <p className="mt-3 text-sm leading-6 text-[#c7b9b2]">
            Un problème technique est survenu. Réessaie dans un instant.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 min-h-11 rounded-xl bg-[#e8be6c] px-6 py-2 font-semibold text-[#21191a] transition hover:bg-[#f1ca7a]"
          >
            Réessayer
          </button>
        </div>
      </main>
    </Layout>
  );
}
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
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [meetingLocation, setMeetingLocation] = useState("");
  const [meetingAt, setMeetingAt] = useState("");
  const [safetyNotes, setSafetyNotes] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [safetyError, setSafetyError] = useState("");
  const [creatingShare, setCreatingShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const messageListRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastTypingBroadcastAtRef = useRef(0);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
            setMessages((previous) => mergeMessages(previous, [incoming]));
            if (incoming.sender_id !== user.id) {
              void client
                .from("messages")
                .update({ read_at: new Date().toISOString() })
                .eq("id", incoming.id);
            }
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "messages",
            filter: `match_id=eq.${matchId}`,
          },
          (payload) => {
            const updated = payload.new as Message;
            setMessages((previous) => mergeMessages(previous, [updated]));
          },
        )
        .on("broadcast", { event: "typing" }, ({ payload }) => {
          if (payload?.userId === user.id) return;
          setIsOtherTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setIsOtherTyping(false);
            typingTimeoutRef.current = null;
          }, 3000);
        })
        .subscribe();
      channelRef.current = channel;

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
          .select("id, sender_id, content, created_at, read_at")
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
          return mergeMessages(existing ?? [], realtimeMessages);
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
      channelRef.current = null;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (channel) void client.removeChannel(channel);
    };
  }, [matchId]);
  useEffect(() => {
    const messageList = messageListRef.current;
    messageList?.scrollTo({ top: messageList.scrollHeight, behavior: "smooth" });
  }, [messages, isOtherTyping]);

  function handleContentChange(value: string) {
    setContent(value);
    if (!myId || !value.trim()) return;

    const now = Date.now();
    if (now - lastTypingBroadcastAtRef.current < 2000) return;
    lastTypingBroadcastAtRef.current = now;
    void channelRef.current
      ?.send({ type: "broadcast", event: "typing", payload: { type: "typing", userId: myId } })
      .catch(() => undefined);
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!supabase || !myId || !content.trim()) return;
    const text = content.trim();
    setContent("");
    setError("");
    const { data: sentMessage, error: sendError } = await supabase
      .from("messages")
      .insert({ match_id: matchId, sender_id: myId, content: text })
      .select("id, sender_id, content, created_at, read_at")
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
    setMessages((previous) => mergeMessages(previous, [sentMessage]));
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

  async function createSafetyShare(event: FormEvent) {
    event.preventDefault();
    if (!supabase || !myId || !meetingLocation.trim() || !meetingAt) return;
    setCreatingShare(true);
    setSafetyError("");
    const { data, error: insertError } = await supabase
      .from("safety_shares")
      .insert({
        user_id: myId,
        match_id: matchId,
        meeting_with: otherName || "Motard(e)",
        meeting_location: meetingLocation.trim(),
        meeting_at: new Date(meetingAt).toISOString(),
        notes: safetyNotes.trim() || null,
      })
      .select("share_token")
      .single();
    setCreatingShare(false);
    if (insertError || !data?.share_token) {
      setSafetyError("Le lien n'a pas pu être créé. Réessaie dans un instant.");
      return;
    }
    setShareUrl(`${window.location.origin}/rdv/${data.share_token}`);
  }

  async function copyShareUrl() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
  }

  async function shareSafetyUrl() {
    await navigator.share({
      title: "Détails de mon rendez-vous",
      text: `Voici les détails de mon rendez-vous avec ${otherName || "mon contact"}.`,
      url: shareUrl,
    });
  }

  return (
    <Layout>
      <div className="h-[calc(100dvh-10rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] overflow-hidden bg-[#21191a] text-[#fff9f0] sm:h-[calc(100dvh-7rem)] md:h-[calc(100dvh-8rem)] xl:h-[calc(100dvh-9rem)]">
        <section className="mx-auto flex h-full min-h-0 max-w-2xl flex-col px-4 py-5 sm:px-6 sm:py-8 md:max-w-3xl lg:max-w-4xl xl:max-w-5xl">
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
                type="button"
                onClick={() => setSafetyOpen(true)}
                className="flex min-h-11 items-center gap-1.5 px-2 text-xs text-[#e8be6c] hover:text-white"
              >
                <Shield className="h-3.5 w-3.5" /> Prévenir un proche
              </button>
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
          <div
            ref={messageListRef}
            className="min-h-0 flex-1 space-y-3 overscroll-contain overflow-y-auto rounded-2xl border border-[#d6a85c]/25 bg-[#302425]/95 p-4"
          >
            {messages.map((message, index) => {
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
                    className={`flex max-w-[75%] flex-col ${isMine ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-2 text-sm ${isMine ? "bg-neutral-900 text-white" : "bg-[var(--ember)] text-white"}`}
                    >
                      {message.content}
                    </div>
                    {index === messages.length - 1 && isMine && message.read_at && (
                      <span className="mt-1 px-1 text-xs text-[#a99b95]">Vu</span>
                    )}
                  </div>
                </div>
              );
            })}
            {isOtherTyping && (
              <p className="text-xs text-[#a99b95]" aria-live="polite">
                {otherName || "Cette personne"} est en train d'écrire…
              </p>
            )}
          </div>
          <form onSubmit={send} className="mt-4 flex gap-2">
            <input
              aria-label="Message"
              className="flex-1 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-[#e2b45f]/70"
              value={content}
              onChange={(event) => handleContentChange(event.target.value)}
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
      <Dialog
        open={safetyOpen}
        onOpenChange={(open) => {
          setSafetyOpen(open);
          if (!open) {
            setShareUrl("");
            setSafetyError("");
            setCopied(false);
          }
        }}
      >
        <DialogContent className="max-w-md border-[#d6a85c]/30 bg-[#302425] text-[#fff9f0]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Shield className="h-5 w-5 text-[#e8be6c]" /> Prévenir un proche
            </DialogTitle>
            <DialogDescription className="text-[#c7b9b2]">
              Crée un lien privé avec les détails de ton rendez-vous avec{" "}
              {otherName || "ce contact"}. Il expirera automatiquement.
            </DialogDescription>
          </DialogHeader>
          {shareUrl ? (
            <div className="space-y-4">
              <label className="block text-sm font-medium" htmlFor="safety-share-url">
                Lien à transmettre
              </label>
              <input
                id="safety-share-url"
                readOnly
                value={shareUrl}
                className="w-full rounded-lg border border-white/15 bg-[#21191a] px-3 py-2 text-sm"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void copyShareUrl()}
                  className="flex min-h-11 items-center gap-2 rounded-lg bg-[#e8be6c] px-4 py-2 font-medium text-[#21191a]"
                >
                  <Copy className="h-4 w-4" /> {copied ? "Lien copié !" : "Copier le lien"}
                </button>
                {typeof navigator !== "undefined" && "share" in navigator && (
                  <button
                    type="button"
                    onClick={() => void shareSafetyUrl()}
                    className="flex min-h-11 items-center gap-2 rounded-lg border border-white/20 px-4 py-2"
                  >
                    <Share2 className="h-4 w-4" /> Partager
                  </button>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={createSafetyShare} className="space-y-4">
              <label className="block text-sm font-medium">
                Lieu du rendez-vous
                <input
                  required
                  value={meetingLocation}
                  onChange={(event) => setMeetingLocation(event.target.value)}
                  maxLength={250}
                  className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#21191a] px-3 py-2"
                />
              </label>
              <label className="block text-sm font-medium">
                Date et heure du rendez-vous
                <input
                  required
                  type="datetime-local"
                  value={meetingAt}
                  onChange={(event) => setMeetingAt(event.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#21191a] px-3 py-2"
                />
              </label>
              <label className="block text-sm font-medium">
                Note (optionnelle)
                <textarea
                  value={safetyNotes}
                  onChange={(event) => setSafetyNotes(event.target.value)}
                  maxLength={500}
                  rows={3}
                  className="mt-1.5 w-full resize-none rounded-lg border border-white/15 bg-[#21191a] px-3 py-2"
                />
              </label>
              {safetyError && (
                <p role="alert" className="text-sm text-red-300">
                  {safetyError}
                </p>
              )}
              <button
                type="submit"
                disabled={creatingShare || !myId}
                className="min-h-11 w-full rounded-lg bg-[#e8be6c] px-4 py-2 font-semibold text-[#21191a] disabled:opacity-50"
              >
                {creatingShare ? "Création…" : "Créer le lien de partage"}
              </button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

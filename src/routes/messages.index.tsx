import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { BadgeCheck, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { requireAppAccess } from "@/lib/require-admin";
import { supabase } from "@/lib/supabase";

type ConversationRow = {
  id: string;
  otherName: string;
  isPremium: boolean;
  photoUrl: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
};

type MessageRow = {
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
};

export const Route = createFileRoute("/messages/")({
  // Supabase persists auth in browser storage, so authorization must run in the browser.
  ssr: false,
  component: Conversations,
  beforeLoad: async () => {
    await requireAppAccess();
    if (!supabase) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/login" });
  },
});

function Conversations() {
  const [conversations, setConversations] = useState<ConversationRow[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    if (!supabase) {
      setError("Supabase n'est pas configuré.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select("id, matched_at, profile_a_id, profile_b_id")
      .or(`profile_a_id.eq.${user.id},profile_b_id.eq.${user.id}`)
      .order("matched_at", { ascending: false });

    if (matchesError) {
      setError("Impossible de charger tes conversations.");
      setConversations([]);
      return;
    }

    const matchIds = (matches ?? []).map((match) => match.id);
    if (!matchIds.length) {
      setConversations([]);
      return;
    }

    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("match_id, sender_id, content, created_at, read_at")
      .in("match_id", matchIds)
      .order("created_at", { ascending: false });

    if (messagesError) {
      setError("Impossible de charger tes conversations.");
      setConversations([]);
      return;
    }

    const latestMessageByMatch = new Map<string, MessageRow>();
    const unreadByMatch = new Map<string, number>();
    for (const message of messages ?? []) {
      if (!latestMessageByMatch.has(message.match_id)) {
        latestMessageByMatch.set(message.match_id, message);
      }
      if (message.sender_id !== user.id && message.read_at === null) {
        unreadByMatch.set(message.match_id, (unreadByMatch.get(message.match_id) ?? 0) + 1);
      }
    }

    const activeMatches = (matches ?? []).filter((match) => latestMessageByMatch.has(match.id));
    const otherIds = activeMatches.map((match) =>
      match.profile_a_id === user.id ? match.profile_b_id : match.profile_a_id,
    );
    const names = new Map<string, string>();
    const premiumStatuses = new Map<string, boolean>();
    const photos = new Map<string, string>();

    if (otherIds.length) {
      const [{ data: profiles }, { data: photoRows }] = await Promise.all([
        supabase.from("profiles").select("id, first_name, is_premium").in("id", otherIds),
        supabase
          .from("profile_photos")
          .select("profile_id, storage_path, position")
          .in("profile_id", otherIds)
          .order("position", { ascending: true }),
      ]);

      for (const profile of profiles ?? []) {
        names.set(profile.id, profile.first_name);
        premiumStatuses.set(profile.id, profile.is_premium === true);
      }
      for (const photo of photoRows ?? []) {
        if (!photos.has(photo.profile_id)) {
          photos.set(
            photo.profile_id,
            supabase.storage.from("profile-photos").getPublicUrl(photo.storage_path).data.publicUrl,
          );
        }
      }
    }

    setConversations(
      activeMatches
        .map((match) => {
          const otherId = match.profile_a_id === user.id ? match.profile_b_id : match.profile_a_id;
          const lastMessage = latestMessageByMatch.get(match.id)!;
          return {
            id: match.id,
            otherName: names.get(otherId) ?? "Motard(e)",
            isPremium: premiumStatuses.get(otherId) ?? false,
            photoUrl: photos.get(otherId) ?? null,
            lastMessage: lastMessage.content,
            lastMessageAt: lastMessage.created_at,
            unreadCount: unreadByMatch.get(match.id) ?? 0,
          };
        })
        .sort(
          (first, second) =>
            new Date(second.lastMessageAt).getTime() - new Date(first.lastMessageAt).getTime(),
        ),
    );
  }

  return (
    <Layout>
      <section className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-16 md:max-w-3xl lg:max-w-4xl xl:max-w-5xl">
        <span className="text-xs uppercase tracking-[0.35em] text-[#e8be6c]">Motards de Cœur</span>
        <h1 className="mt-3 mb-6 font-display text-3xl sm:text-4xl">
          Mes discussions{conversations !== null && ` (${conversations.length})`}
        </h1>

        {error && (
          <p role="alert" className="mb-4 rounded-xl border border-primary/40 p-4 text-sm">
            {error}
          </p>
        )}
        {conversations === null && !error && <p className="text-sm text-[#d4c6bf]">Chargement…</p>}
        {conversations?.length === 0 && (
          <div className="rounded-2xl border border-[#d6a85c]/20 bg-[#302425]/80 p-8 text-center sm:p-10">
            <MessageCircle
              className="mx-auto h-16 w-16 text-[#e2b45f]"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-[#d4c6bf]">
              Aucune conversation pour l'instant — direction{" "}
              <Link to="/matches" className="text-primary hover:underline">
                Coup de cœur
              </Link>{" "}
              pour démarrer une discussion !
            </p>
          </div>
        )}

        <ul className="space-y-3">
          {conversations?.map((conversation) => (
            <li key={conversation.id}>
              <Link
                to="/messages/$matchId"
                params={{ matchId: conversation.id }}
                className="flex items-center gap-4 rounded-2xl border border-[#d6a85c]/20 bg-[#302425]/80 p-4 transition hover:border-[#d6a85c]/40"
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-[#211819]">
                  {conversation.photoUrl && (
                    <img
                      src={conversation.photoUrl}
                      alt={conversation.otherName}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{conversation.otherName}</p>
                    {conversation.isPremium && (
                      <BadgeCheck
                        aria-label="Profil Premium vérifié"
                        className="h-4 w-4 shrink-0 text-[#e8be6c]"
                      />
                    )}
                    {conversation.unreadCount > 0 && (
                      <span
                        aria-label={`${conversation.unreadCount} message${conversation.unreadCount > 1 ? "s" : ""} non lu${conversation.unreadCount > 1 ? "s" : ""}`}
                        className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground"
                      >
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-sm text-[#d4c6bf]">{conversation.lastMessage}</p>
                </div>
                <time
                  dateTime={conversation.lastMessageAt}
                  className="shrink-0 self-start text-right text-[11px] text-[#a99b95]"
                >
                  {new Date(conversation.lastMessageAt).toLocaleString("fr-FR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </Layout>
  );
}

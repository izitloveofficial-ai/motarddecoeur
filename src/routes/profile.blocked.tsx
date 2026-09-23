import { createFileRoute, redirect } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { requireAppAccess } from "@/lib/require-admin";
import { supabase } from "@/lib/supabase";

type BlockedProfile = {
  id: string;
  firstName: string;
  photoUrl: string | null;
};

export const Route = createFileRoute("/profile/blocked")({
  // Supabase persists auth in browser storage, so authorization must run in the browser.
  ssr: false,
  component: BlockedProfiles,
  beforeLoad: async () => {
    await requireAppAccess();
    if (!supabase) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/login" });
  },
});

function BlockedProfiles() {
  const [profiles, setProfiles] = useState<BlockedProfile[] | null>(null);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadBlockedProfiles();
  }, []);

  async function loadBlockedProfiles() {
    if (!supabase) return setError("Supabase n'est pas configuré.");
    setError("");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: blocks, error: blocksError } = await supabase
      .from("blocks")
      .select("blocked_id")
      .eq("blocker_id", user.id);
    if (blocksError) {
      setError("Impossible de charger les personnes bloquées.");
      setProfiles([]);
      return;
    }

    const blockedIds = (blocks ?? []).map((block) => block.blocked_id);
    if (!blockedIds.length) {
      setProfiles([]);
      return;
    }

    const [{ data: profileRows, error: profilesError }, { data: photoRows }] = await Promise.all([
      supabase.from("profiles").select("id, first_name").in("id", blockedIds),
      supabase
        .from("profile_photos")
        .select("profile_id, storage_path, position")
        .in("profile_id", blockedIds)
        .order("position", { ascending: true }),
    ]);
    if (profilesError) {
      setError("Impossible de charger les personnes bloquées.");
      setProfiles([]);
      return;
    }

    const photos = new Map<string, string>();
    for (const photo of photoRows ?? []) {
      if (!photos.has(photo.profile_id)) {
        const { data } = supabase.storage.from("profile-photos").getPublicUrl(photo.storage_path);
        photos.set(photo.profile_id, data.publicUrl);
      }
    }
    const names = new Map((profileRows ?? []).map((profile) => [profile.id, profile.first_name]));
    setProfiles(
      blockedIds.map((id) => ({
        id,
        firstName: names.get(id) ?? "Motard(e)",
        photoUrl: photos.get(id) ?? null,
      })),
    );
  }

  async function unblock(blockedId: string) {
    if (!supabase) return;
    setError("");
    setUnblockingId(blockedId);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setUnblockingId(null);
      return;
    }
    const { error: unblockError } = await supabase
      .from("blocks")
      .delete()
      .eq("blocker_id", user.id)
      .eq("blocked_id", blockedId);
    if (unblockError) {
      setError("Cette personne n'a pas pu être débloquée.");
      setUnblockingId(null);
      return;
    }
    await loadBlockedProfiles();
    setUnblockingId(null);
  }

  return (
    <Layout>
      <section className="mx-auto max-w-2xl px-6 py-12 sm:py-16 md:max-w-3xl lg:max-w-4xl xl:max-w-5xl">
        <span className="text-xs uppercase tracking-[0.35em] text-[#e8be6c]">Motards de Cœur</span>
        <h1 className="mt-3 mb-2 font-display text-4xl">Personnes bloquées</h1>
        <p className="mb-8 text-sm text-[#a99b95]">
          Gérez les personnes que vous ne souhaitez plus voir ni contacter.
        </p>

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-xl border border-primary/40 bg-primary/10 p-4 text-sm"
          >
            {error}
          </p>
        )}
        {profiles === null && !error && <p className="text-sm text-[#d4c6bf]">Chargement…</p>}
        {profiles?.length === 0 && (
          <div className="rounded-2xl border border-[#d6a85c]/25 bg-[#302425]/95 p-8 text-center text-sm text-[#d4c6bf]">
            <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-[#e2b45f]" aria-hidden="true" />
            Vous n'avez bloqué personne pour le moment.
          </div>
        )}
        <ul className="space-y-3">
          {profiles?.map((profile) => (
            <li
              key={profile.id}
              className="flex items-center gap-4 rounded-2xl border border-[#d6a85c]/20 bg-[#302425]/80 p-4"
            >
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-[#211819]">
                {profile.photoUrl ? (
                  <img
                    src={profile.photoUrl}
                    alt={`Photo de ${profile.firstName}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-lg text-[#8c7a75]">
                    {profile.firstName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <p className="min-w-0 flex-1 truncate font-medium">{profile.firstName}</p>
              <button
                type="button"
                disabled={unblockingId === profile.id}
                onClick={() => void unblock(profile.id)}
                className="rounded-full border border-[#e2b45f]/50 px-4 py-2 text-xs font-medium uppercase tracking-wider text-[#e8be6c] transition hover:bg-[#e2b45f]/10 disabled:cursor-wait disabled:opacity-50"
              >
                {unblockingId === profile.id ? "Déblocage…" : "Débloquer"}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </Layout>
  );
}

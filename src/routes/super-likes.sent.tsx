import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { CalendarDays, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { DoubleHeartIcon } from "@/components/icons/DoubleHeartIcon";
import { Layout } from "@/components/Layout";
import { requireAppAccess } from "@/lib/require-admin";
import { requireDatingIntent } from "@/lib/require-dating-intent";
import { supabase } from "@/lib/supabase";

type SentSuperLike = {
  id: string;
  firstName: string;
  photoUrl: string | null;
  sentAt: string;
};

export const Route = createFileRoute("/super-likes/sent")({
  ssr: false,
  component: SentSuperLikes,
  beforeLoad: async () => {
    await requireAppAccess();
    await requireDatingIntent();
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
});

function SentSuperLikes() {
  const [superLikes, setSuperLikes] = useState<SentSuperLike[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadSuperLikes();
  }, []);

  async function loadSuperLikes() {
    if (!supabase) {
      setError("Supabase n'est pas configuré.");
      return;
    }

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;

    const { data: rows, error: rowsError } = await supabase
      .from("swipes")
      .select("swiped_id, created_at")
      .eq("swiper_id", auth.user.id)
      .eq("liked", true)
      .eq("is_super", true)
      .order("created_at", { ascending: false });

    if (rowsError) {
      setError("Impossible de charger tes Super coups de cœur envoyés.");
      setSuperLikes([]);
      return;
    }

    const profileIds = [...new Set((rows ?? []).map((row) => row.swiped_id))];
    const names = new Map<string, string>();
    const photos = new Map<string, string>();

    if (profileIds.length > 0) {
      const [{ data: profiles, error: profilesError }, { data: photoRows, error: photosError }] =
        await Promise.all([
          supabase.from("profiles").select("id, first_name").in("id", profileIds),
          supabase
            .from("profile_photos")
            .select("profile_id, storage_path, position")
            .in("profile_id", profileIds)
            .order("position", { ascending: true }),
        ]);

      if (profilesError || photosError) {
        setError("Impossible de charger les profils de tes Super coups de cœur.");
        setSuperLikes([]);
        return;
      }

      for (const profile of profiles ?? []) names.set(profile.id, profile.first_name);
      for (const photo of photoRows ?? []) {
        if (!photos.has(photo.profile_id)) {
          photos.set(
            photo.profile_id,
            supabase.storage.from("profile-photos").getPublicUrl(photo.storage_path).data.publicUrl,
          );
        }
      }
    }

    setSuperLikes(
      (rows ?? []).map((row) => ({
        id: `${row.swiped_id}-${row.created_at}`,
        firstName: names.get(row.swiped_id) ?? "Profil indisponible",
        photoUrl: photos.get(row.swiped_id) ?? null,
        sentAt: row.created_at,
      })),
    );
  }

  return (
    <Layout>
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-16">
        <span className="text-xs uppercase tracking-[0.35em] text-[#e8be6c]">Motards de Cœur</span>
        <div className="mt-3 mb-8 flex items-center gap-3">
          <DoubleHeartIcon className="h-8 w-8 shrink-0 text-[#e8be6c]" aria-hidden="true" />
          <h1 className="font-display text-3xl sm:text-4xl">Super coups de cœur envoyés</h1>
        </div>

        {error && (
          <p role="alert" className="mb-4 rounded-xl border border-primary/40 p-4 text-sm">
            {error}
          </p>
        )}

        {superLikes === null && !error && <p className="text-sm text-[#d4c6bf]">Chargement…</p>}

        {superLikes?.length === 0 && !error && (
          <div className="rounded-2xl border border-[#d6a85c]/25 bg-[#302425]/95 p-8 text-center sm:p-10">
            <DoubleHeartIcon className="mx-auto h-12 w-12 text-[#e8be6c]" aria-hidden="true" />
            <h2 className="mt-5 font-display text-2xl text-[#fff9f0]">
              Aucun Super coup de cœur envoyé
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#d4c6bf]">
              Les Super coups de cœur que tu enverras apparaîtront ici.
            </p>
            <Link
              to="/discover"
              className="mt-6 inline-flex rounded-full bg-gradient-red px-5 py-3 text-xs font-medium uppercase tracking-wider text-primary-foreground no-underline"
            >
              Découvrir des profils
            </Link>
          </div>
        )}

        {superLikes && superLikes.length > 0 && (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {superLikes.map((superLike) => (
              <li key={superLike.id}>
                <article className="h-full overflow-hidden rounded-2xl border border-[#d6a85c]/25 bg-[#302425]/90">
                  <div className="aspect-[4/3] bg-[#211819]">
                    {superLike.photoUrl ? (
                      <img
                        src={superLike.photoUrl}
                        alt={`Photo de ${superLike.firstName}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-[#e8be6c]/50">
                        <Heart className="h-10 w-10" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h2 className="font-display text-2xl text-[#fff9f0]">{superLike.firstName}</h2>
                    <p className="mt-2 flex items-center gap-2 text-sm text-[#d4c6bf]">
                      <CalendarDays
                        className="h-4 w-4 shrink-0 text-[#e8be6c]"
                        aria-hidden="true"
                      />
                      Envoyé le {new Date(superLike.sentAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Layout>
  );
}

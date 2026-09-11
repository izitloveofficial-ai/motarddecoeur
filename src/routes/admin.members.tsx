import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Member = {
  id: string;
  first_name: string;
  birth_date: string;
  gender: string | null;
  looking_for: string | null;
  moto_brand: string | null;
  moto_model: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  photoCount: number;
};
export const Route = createFileRoute("/admin/members")({
  component: AdminMembers,
  beforeLoad: async () => {
    if (!supabase) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/admin/login" });
    const { data: admin } = await supabase.rpc("is_admin");
    if (!admin) {
      await supabase.auth.signOut();
      throw redirect({ to: "/admin/login" });
    }
  },
});
function age(value: string) {
  const birth = new Date(value);
  const now = new Date();
  let result = now.getFullYear() - birth.getFullYear();
  if (now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate())) result--;
  return result;
}
function AdminMembers() {
  const [rows, setRows] = useState<Member[]>([]);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("Chargement…");
  const [pendingId, setPendingId] = useState<string | null>(null);
  useEffect(() => {
    void load();
  }, []);
  async function load() {
    if (!supabase) return setNotice("Supabase n'est pas configuré.");
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select(
        "id, first_name, birth_date, gender, looking_for, moto_brand, moto_model, is_active, is_verified, created_at",
      )
      .order("created_at", { ascending: false });
    if (error) {
      setNotice("Accès refusé : un compte administrateur est requis.");
      return;
    }
    const counts = new Map<string, number>();
    const ids = (profiles ?? []).map((profile) => profile.id);
    if (ids.length) {
      const { data: photos } = await supabase
        .from("profile_photos")
        .select("profile_id")
        .in("profile_id", ids);
      for (const photo of photos ?? [])
        counts.set(photo.profile_id, (counts.get(photo.profile_id) ?? 0) + 1);
    }
    setRows(
      (profiles ?? []).map((profile) => ({ ...profile, photoCount: counts.get(profile.id) ?? 0 })),
    );
    setNotice(profiles?.length ? "" : "Aucun membre inscrit pour le moment.");
  }
  async function toggle(member: Member) {
    if (!supabase) return;
    setPendingId(member.id);
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: !member.is_active })
      .eq("id", member.id);
    setNotice(error ? "Le statut n'a pas pu être modifié." : "");
    await load();
    setPendingId(null);
  }
  const shown = useMemo(
    () => rows.filter((row) => row.first_name.toLowerCase().includes(query.trim().toLowerCase())),
    [rows, query],
  );
  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs uppercase tracking-[.3em] text-primary">Administration privée</p>
        <h1 className="mt-2 font-display text-4xl">Membres inscrits</h1>
        <div className="my-8 grid gap-4 sm:grid-cols-3">
          {[
            ["Total", rows.length],
            ["Actifs", rows.filter((row) => row.is_active).length],
            ["Vérifiés", rows.filter((row) => row.is_verified).length],
          ].map(([label, value]) => (
            <div className="rounded-2xl border p-5" key={label}>
              <p className="text-sm text-muted-foreground">{label}</p>
              <strong className="text-3xl">{value}</strong>
            </div>
          ))}
        </div>
        <input
          aria-label="Rechercher un membre"
          className="mb-5 w-full max-w-md rounded-xl border bg-card px-4 py-2"
          type="search"
          placeholder="Rechercher un prénom…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {notice && (
          <p className="mb-4 rounded-xl border border-primary/30 p-3" role="status">
            {notice}
          </p>
        )}
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full text-left text-sm">
            <thead className="bg-card">
              <tr>
                {[
                  "Prénom",
                  "Âge",
                  "Genre",
                  "Recherche",
                  "Moto",
                  "Photos",
                  "Inscription",
                  "Statut",
                  "Action",
                ].map((heading) => (
                  <th className="p-3" key={heading}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((member) => (
                <tr className="border-t" key={member.id}>
                  <td className="p-3">{member.first_name}</td>
                  <td className="p-3">{age(member.birth_date)}</td>
                  <td className="p-3">{member.gender ?? "—"}</td>
                  <td className="p-3">{member.looking_for ?? "—"}</td>
                  <td className="p-3">
                    {[member.moto_brand, member.moto_model].filter(Boolean).join(" ") || "—"}
                  </td>
                  <td className="p-3">{member.photoCount}</td>
                  <td className="p-3">{new Date(member.created_at).toLocaleDateString("fr-FR")}</td>
                  <td className="p-3">{member.is_active ? "Actif" : "Désactivé"}</td>
                  <td className="p-3">
                    <button
                      disabled={pendingId === member.id}
                      className="text-primary disabled:opacity-50"
                      onClick={() => void toggle(member)}
                    >
                      {member.is_active ? "Désactiver" : "Réactiver"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-6 text-sm">
          <Link to="/admin/preinscriptions" className="text-primary hover:underline">
            Voir les pré-inscriptions
          </Link>
        </p>
      </div>
    </main>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ageFromBirthDate, formatDateFr } from "@/lib/format";
import { requireAdminPage } from "@/lib/require-admin";
import { AdminNotice, AdminShell } from "@/components/admin/AdminShell";

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
type Photo = {
  id: string;
  storage_path: string;
  url: string;
};
export const Route = createFileRoute("/admin/members")({
  ssr: false,
  component: AdminMembers,
  beforeLoad: requireAdminPage,
});
function AdminMembers() {
  const [rows, setRows] = useState<Member[]>([]);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("Chargement…");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [pendingPhotoId, setPendingPhotoId] = useState<string | null>(null);
  useEffect(() => {
    void load();
  }, []);
  async function togglePhotos(memberId: string) {
    if (expandedId === memberId) {
      setExpandedId(null);
      setPhotos([]);
      return;
    }
    setExpandedId(memberId);
    setPhotos([]);
    if (!supabase) return;
    const client = supabase;
    setPhotosLoading(true);
    const { data } = await client
      .from("profile_photos")
      .select("id, storage_path")
      .eq("profile_id", memberId)
      .order("position", { ascending: true });
    setPhotos(
      (data ?? []).map((photo) => ({
        ...photo,
        url: client.storage.from("profile-photos").getPublicUrl(photo.storage_path).data.publicUrl,
      })),
    );
    setPhotosLoading(false);
  }
  async function deletePhoto(photo: Photo, memberId: string) {
    if (!supabase) return;
    if (!window.confirm("Supprimer définitivement cette photo ?")) return;
    setPendingPhotoId(photo.id);
    const { error: storageError } = await supabase.storage
      .from("profile-photos")
      .remove([photo.storage_path]);
    const { error: rowError } = await supabase.from("profile_photos").delete().eq("id", photo.id);
    setPendingPhotoId(null);
    if (storageError || rowError) {
      setNotice("La photo n'a pas pu être supprimée.");
      return;
    }
    setPhotos((current) => current.filter((item) => item.id !== photo.id));
    setRows((current) =>
      current.map((row) =>
        row.id === memberId ? { ...row, photoCount: Math.max(0, row.photoCount - 1) } : row,
      ),
    );
  }
  async function load(): Promise<boolean> {
    if (!supabase) {
      setNotice("Supabase n'est pas configuré.");
      return false;
    }
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select(
        "id, first_name, birth_date, gender, looking_for, moto_brand, moto_model, is_active, is_verified, created_at",
      )
      .order("created_at", { ascending: false });
    if (error) {
      setNotice("Accès refusé : un compte administrateur est requis.");
      return false;
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
    return true;
  }
  async function toggle(member: Member) {
    if (!supabase) return;
    setPendingId(member.id);
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: !member.is_active })
      .eq("id", member.id);
    // Le rechargement efface le message d'état : on le remet ensuite pour que l'échec reste visible.
    const reloaded = await load();
    if (error && reloaded) setNotice("Le statut n'a pas pu être modifié.");
    setPendingId(null);
  }
  async function ban(member: Member) {
    if (!supabase) return;
    if (
      !window.confirm(
        `Bannir définitivement le compte de ${member.first_name} ? Toutes ses données seront supprimées. Cette action est irréversible.`,
      )
    )
      return;
    setPendingId(member.id);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const { error } = await supabase.functions.invoke("admin-ban-user", {
      body: { profile_id: member.id },
      headers: session ? { Authorization: `Bearer ${session.access_token}` } : undefined,
    });
    const reloaded = await load();
    if (reloaded) {
      setNotice(error ? "Le bannissement a échoué." : "Compte banni et supprimé définitivement.");
    }
    setPendingId(null);
  }
  const shown = useMemo(
    () => rows.filter((row) => row.first_name.toLowerCase().includes(query.trim().toLowerCase())),
    [rows, query],
  );
  return (
    <AdminShell title="Membres inscrits" current="/admin/members">
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
      <AdminNotice message={notice} />
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
              <Fragment key={member.id}>
                <tr className="border-t">
                  <td className="p-3">{member.first_name}</td>
                  <td className="p-3">{ageFromBirthDate(member.birth_date)}</td>
                  <td className="p-3">{member.gender ?? "—"}</td>
                  <td className="p-3">{member.looking_for ?? "—"}</td>
                  <td className="p-3 space-x-2 whitespace-nowrap">
                    {[member.moto_brand, member.moto_model].filter(Boolean).join(" ") || "—"}
                  </td>
                  <td className="p-3">
                    <button
                      className="text-primary underline disabled:opacity-50"
                      disabled={member.photoCount === 0}
                      onClick={() => void togglePhotos(member.id)}
                    >
                      {member.photoCount}
                      {expandedId === member.id ? " ▲" : member.photoCount ? " ▾" : ""}
                    </button>
                  </td>
                  <td className="p-3">{formatDateFr(member.created_at)}</td>
                  <td className="p-3">{member.is_active ? "Actif" : "Désactivé"}</td>
                  <td className="p-3">
                    <button
                      disabled={pendingId === member.id}
                      className="text-primary disabled:opacity-50"
                      onClick={() => void toggle(member)}
                    >
                      {member.is_active ? "Désactiver" : "Réactiver"}
                    </button>
                    <button
                      disabled={pendingId === member.id}
                      className="text-destructive font-semibold underline disabled:opacity-50"
                      onClick={() => void ban(member)}
                    >
                      Bannir
                    </button>
                  </td>
                </tr>
                {expandedId === member.id && (
                  <tr className="border-t bg-card/50">
                    <td className="p-4" colSpan={9}>
                      {photosLoading ? (
                        <p className="text-sm text-muted-foreground">Chargement des photos…</p>
                      ) : photos.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Aucune photo.</p>
                      ) : (
                        <div className="flex flex-wrap gap-4">
                          {photos.map((photo) => (
                            <div className="w-32 text-center" key={photo.id}>
                              <img
                                src={photo.url}
                                alt="Photo de profil"
                                className="h-32 w-32 rounded-xl object-cover"
                              />
                              <button
                                disabled={pendingPhotoId === photo.id}
                                className="mt-2 text-xs text-destructive underline disabled:opacity-50"
                                onClick={() => void deletePhoto(photo, member.id)}
                              >
                                Supprimer
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, MapPin, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type SafetyShare = {
  organizer_first_name: string;
  meeting_with: string;
  meeting_location: string;
  meeting_at: string;
  notes: string | null;
  expired: boolean;
};

export const Route = createFileRoute("/rdv/$token")({
  ssr: false,
  component: SharedAppointment,
});

function SharedAppointment() {
  const { token } = Route.useParams();
  const [share, setShare] = useState<SafetyShare | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadShare() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.rpc("get_safety_share", { p_token: token });
      if (cancelled) return;
      const result = Array.isArray(data) ? data[0] : data;
      setShare(error ? null : (result as SafetyShare | null));
      setLoading(false);
    }
    void loadShare();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <main className="min-h-screen bg-[#21191a] px-4 py-12 text-[#fff9f0] sm:py-20">
      <div className="mx-auto max-w-lg rounded-2xl border border-[#d6a85c]/25 bg-[#302425] p-6 shadow-xl sm:p-8">
        {loading ? (
          <p className="text-center text-[#c7b9b2]">Chargement du rendez-vous…</p>
        ) : !share || share.expired ? (
          <div className="py-10 text-center">
            <ShieldCheck className="mx-auto mb-4 h-10 w-10 text-[#e8be6c]" />
            <h1 className="font-display text-2xl">Ce lien n'est plus valide.</h1>
          </div>
        ) : (
          <article>
            <ShieldCheck className="mb-5 h-10 w-10 text-[#e8be6c]" />
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#e8be6c]">
              Détails du rendez-vous
            </p>
            <h1 className="font-display text-3xl leading-tight">
              Rendez-vous de {share.organizer_first_name} avec {share.meeting_with}
            </h1>
            <dl className="mt-8 space-y-6">
              <div className="flex gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#e8be6c]" />
                <div>
                  <dt className="text-sm text-[#a99b95]">Lieu</dt>
                  <dd className="mt-1 whitespace-pre-wrap">{share.meeting_location}</dd>
                </div>
              </div>
              <div className="flex gap-3">
                <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-[#e8be6c]" />
                <div>
                  <dt className="text-sm text-[#a99b95]">Date et heure</dt>
                  <dd className="mt-1">
                    {new Intl.DateTimeFormat("fr-FR", {
                      dateStyle: "full",
                      timeStyle: "short",
                    }).format(new Date(share.meeting_at))}
                  </dd>
                </div>
              </div>
              {share.notes && (
                <div>
                  <dt className="text-sm text-[#a99b95]">Note</dt>
                  <dd className="mt-1 whitespace-pre-wrap rounded-xl bg-[#21191a] p-4">
                    {share.notes}
                  </dd>
                </div>
              )}
            </dl>
          </article>
        )}
      </div>
    </main>
  );
}

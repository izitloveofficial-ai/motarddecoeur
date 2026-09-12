import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Announcement = {
  id: string;
  title: string;
  body: string;
};

const DISMISSED_KEY = "mdc_dismissed_announcement";

export function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setLoggedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !loggedIn) return;
    let cancelled = false;
    void supabase
      .from("announcements")
      .select("id, title, body")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data) return;
        const dismissed =
          typeof window !== "undefined" ? window.localStorage.getItem(DISMISSED_KEY) : null;
        if (dismissed === data.id) return;
        setAnnouncement(data);
      });
    return () => {
      cancelled = true;
    };
  }, [loggedIn]);

  if (!announcement) return null;

  function dismiss() {
    if (!announcement) return;
    window.localStorage.setItem(DISMISSED_KEY, announcement.id);
    setAnnouncement(null);
  }

  return (
    <div className="bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3 text-sm">
        <p>
          <strong className="font-semibold">{announcement.title}</strong>
          <span className="ml-2">{announcement.body}</span>
        </p>
        <button
          aria-label="Fermer l'annonce"
          onClick={dismiss}
          className="shrink-0 rounded-full p-1 hover:bg-black/10"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

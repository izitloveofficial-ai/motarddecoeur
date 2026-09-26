import { type ReactNode, useEffect, useRef, useState } from "react";

import { Navbar } from "./Navbar";
import { AnnouncementBanner } from "./AnnouncementBanner";
import { MobileTabBar } from "./MobileTabBar";
import { SuperLikeReveal } from "./SuperLikeReveal";
import { registerForPushNotifications } from "@/lib/push";
import { supabase } from "@/lib/supabase";

type UnseenSuperLike = {
  swipe_id: string;
  first_name: string;
};

export function Layout({ children }: { children: ReactNode }) {
  const [unseenSuperLike, setUnseenSuperLike] = useState<UnseenSuperLike | null>(null);
  const checkedUserId = useRef<string | null>(null);
  const closingSwipeId = useRef<string | null>(null);

  useEffect(() => {
    void registerForPushNotifications();
  }, []);

  useEffect(() => {
    if (!supabase) return;

    async function loadUnseenSuperLike(userId: string) {
      if (!supabase || checkedUserId.current === userId) return;
      checkedUserId.current = userId;

      const { data, error } = await supabase.rpc("next_unseen_super_like");
      if (error) {
        checkedUserId.current = null;
        return;
      }

      const result = Array.isArray(data) ? data[0] : data;
      if (result?.swipe_id && result?.first_name) {
        setUnseenSuperLike({ swipe_id: result.swipe_id, first_name: result.first_name });
      }
    }

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void loadUnseenSuperLike(data.session.user.id);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        void loadUnseenSuperLike(session.user.id);
      } else {
        checkedUserId.current = null;
        setUnseenSuperLike(null);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  async function closeSuperLikeReveal() {
    if (!supabase || !unseenSuperLike || closingSwipeId.current === unseenSuperLike.swipe_id)
      return;

    const swipeId = unseenSuperLike.swipe_id;
    closingSwipeId.current = swipeId;
    const { error } = await supabase.rpc("mark_super_like_seen", { target_swipe_id: swipeId });
    if (!error) setUnseenSuperLike(null);
    closingSwipeId.current = null;
  }

  return (
    <div className="app-shell min-h-screen flex flex-col">
      <Navbar />
      <AnnouncementBanner />
      <main className="app-main flex-1 pb-20 pt-24 sm:pb-0 sm:pt-28 md:pt-32 xl:pt-36">
        {children}
      </main>
      <MobileTabBar />
      {unseenSuperLike && (
        <SuperLikeReveal
          firstName={unseenSuperLike.first_name}
          onClose={() => void closeSuperLikeReveal()}
        />
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useAdminStatus() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    const load = async (hasSession: boolean) => {
      if (!hasSession || !supabase) {
        setIsAdmin(false);
        return;
      }
      const { data } = await supabase.rpc("is_admin");
      setIsAdmin(data === true);
    };

    void supabase.auth.getSession().then(({ data }) => load(Boolean(data.session)));
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      void load(Boolean(session));
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  return isAdmin;
}

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

/**
 * A React hook that provides the current user's ID.
 * @returns The current user's ID or null if the user is not logged in or undefined if the user's ID is still being fetched.
 */
export function useCurrentUserId(): string | null | undefined {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return userId;
}

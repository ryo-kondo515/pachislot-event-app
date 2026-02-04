import { supabase } from "@/lib/_core/supabase";
import type { User } from "@/lib/_core/auth";
import { useCallback, useEffect, useState } from "react";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const mapUser = (supabaseUser: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }): User => ({
    id: supabaseUser.id,
    name: (supabaseUser.user_metadata?.name as string) || null,
    email: supabaseUser.email || null,
  });

  useEffect(() => {
    // 初期セッション確認
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(mapUser(session.user));
      }
      setLoading(false);
    });

    // 認証状態変化を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(mapUser(session.user));
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const refresh = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(mapUser(session.user));
      } else {
        setUser(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to refresh"));
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Logout failed"));
    }
  }, []);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    refresh,
    logout,
  };
}

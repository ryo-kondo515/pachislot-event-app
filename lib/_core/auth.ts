import { supabase } from "./supabase";

export type User = {
  id: string;
  name: string | null;
  email: string | null;
};

export async function getSessionToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch (error) {
    console.error("[Auth] Failed to get session token:", error);
    return null;
  }
}

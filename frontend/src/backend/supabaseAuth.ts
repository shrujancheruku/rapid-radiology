import { createClient } from "@supabase/supabase-js";
import type { AppUser, AuthService } from "@/backend/types";

/**
 * Side-effect free: the Supabase client is only created when this is called,
 * so a demo build (which never calls it) needs no Supabase env vars.
 */
export function createSupabaseAuth(): AuthService {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set (or build with --mode demo).",
    );
  }
  const supabase = createClient(url, anonKey);

  const toAppUser = (email: string | undefined): AppUser | null =>
    email === undefined ? null : { email };

  return {
    async getUser() {
      const { data } = await supabase.auth.getSession();
      return toAppUser(data.session?.user.email);
    },

    onChange(cb) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        cb(toAppUser(session?.user.email));
      });
      return () => subscription.unsubscribe();
    },

    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    },

    async signOut() {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },

    async getAccessToken() {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    },
  };
}

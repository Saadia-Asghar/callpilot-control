/**
 * OAuth integration — uses Supabase directly for Google Sign-In.
 * (Lovable cloud auth endpoint is no longer available.)
 */
import { supabase, isSupabaseConfigured } from "../supabase/client";

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const lovable = {
  /** Whether Google/Apple OAuth can be used (Supabase must be configured) */
  isOAuthAvailable: isSupabaseConfigured,
  auth: {
    signInWithOAuth: async (provider: "google" | "apple", opts?: SignInOptions) => {
      if (!isSupabaseConfigured || !supabase) {
        return {
          error: new Error(
            "Google Sign-In requires Supabase (VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY) to be set."
          ),
        };
      }
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: opts?.redirect_uri || window.location.origin,
          },
        });
        if (error) return { error };
        return { data, error: null };
      } catch (e) {
        return { error: e instanceof Error ? e : new Error(String(e)) };
      }
    },
  },
};

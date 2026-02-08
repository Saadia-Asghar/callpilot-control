/**
 * Supabase URL helper — works even if VITE_SUPABASE_URL is missing
 * by falling back to the project ID based URL.
 */
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co`;

export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

import { createContext, useContext, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";


interface User {
  id: string | number;
  email: string;
  name?: string;
  business_name?: string;
  provider?: "supabase" | "backend";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name?: string, business_name?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const initAuth = async () => {
      // 1. Check Supabase session (handles Google OAuth redirects too)
      if (isSupabaseConfigured && supabase) {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.user && !cancelled) {
            setUser({
              id: session.user.id,
              email: session.user.email ?? "",
              name:
                session.user.user_metadata?.full_name ??
                session.user.user_metadata?.name,
              provider: "supabase",
            });
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn("Supabase session check failed:", e);
        }
      }

      // No backend fallback — Cloud auth only

      if (!cancelled) setLoading(false);
    };

    initAuth();

    // Listen for Supabase auth changes (e.g. OAuth redirect callback)
    let subscription: { unsubscribe: () => void } | undefined;
    if (isSupabaseConfigured && supabase) {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email ?? "",
            name:
              session.user.user_metadata?.full_name ??
              session.user.user_metadata?.name,
            provider: "supabase",
          });
        } else {
          // Only clear user if they were a Supabase user
          setUser((prev) => (prev?.provider === "supabase" ? null : prev));
        }
        setLoading(false);
      });
      subscription = data.subscription;
    }

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sign Up ──
  const signUp = async (
    email: string,
    password: string,
    name?: string,
    business_name?: string
  ) => {
    // When Supabase is configured (deployed on Lovable/Vercel), use it exclusively
    if (isSupabaseConfigured && supabase) {
      try {
      const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name, business_name },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) {
          return { error: { message: error.message } };
        }
        if (data.user) {
          // Supabase may return a user even if email confirmation is required
          // identities array is empty when email is already taken (in some configs)
          if (
            data.user.identities &&
            data.user.identities.length === 0
          ) {
            return {
              error: {
                message:
                  "This email is already registered. Try logging in instead.",
              },
            };
          }
          setUser({
            id: data.user.id,
            email: data.user.email ?? email,
            name,
            business_name,
            provider: "supabase",
          });
          return { error: null };
        }
        return { error: null }; // signup successful, may need email confirmation
      } catch (err: any) {
        return {
          error: { message: err?.message || "Sign up failed" },
        };
      }
    }

    return { error: { message: "Authentication service not available." } };
  };

  // ── Sign In ──
  const signIn = async (email: string, password: string) => {
    // When Supabase is configured, use it exclusively
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          return { error: { message: error.message } };
        }
        if (data.user) {
          setUser({
            id: data.user.id,
            email: data.user.email ?? email,
            name: data.user.user_metadata?.full_name,
            provider: "supabase",
          });
          return { error: null };
        }
        return { error: { message: "Login failed" } };
      } catch (err: any) {
        return {
          error: { message: err?.message || "Login failed" },
        };
      }
    }

    return { error: { message: "Authentication service not available." } };
  };

  // ── Sign Out ──
  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

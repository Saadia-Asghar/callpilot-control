import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { supabase as supabaseClient, isSupabaseConfigured } from "@/integrations/supabase/client";
import { createClient } from "@supabase/supabase-js";

// Fallback: if env vars didn't resolve, create client with known Cloud values
function getSupabase() {
  if (supabaseClient) return supabaseClient;
  const url = import.meta.env.VITE_SUPABASE_URL || "https://cyeiioxtwnxhpvhndfke.supabase.co";
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5ZWlpb3h0d254aHB2aG5kZmtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MjE1MjksImV4cCI6MjA4NjA5NzUyOX0.wBcYAWxdE8MTBepuz7xOMTQVds7OiJlYVxyT1q3ScjY";
  return createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
}

const supabase = getSupabase();


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
      // 1. Check existing session
      {
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
    {
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
    if (!supabase) {
      return { error: { message: "Authentication service not available. Please refresh and try again." } };
    }
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
        if (data.user.identities && data.user.identities.length === 0) {
          return { error: { message: "This email is already registered. Try logging in instead." } };
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
      return { error: null };
    } catch (err: any) {
      return { error: { message: err?.message || "Sign up failed" } };
    }
  };

  // ── Sign In ──
  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: { message: "Authentication service not available. Please refresh and try again." } };
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
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
      return { error: { message: err?.message || "Login failed" } };
    }
  };

  // ── Sign Out ──
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

import { createContext, useContext, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import api from "@/lib/api";

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
      // 1. Check Supabase session first (handles Google OAuth redirects too)
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && !cancelled) {
            setUser({
              id: session.user.id,
              email: session.user.email ?? "",
              name: session.user.user_metadata?.full_name ?? session.user.user_metadata?.name,
              provider: "supabase",
            });
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn("Supabase session check failed:", e);
        }
      }

      // 2. Check backend token
      const token = localStorage.getItem("callpilot_token");
      if (token) {
        try {
          // Try to validate token with backend /auth/me
          const me: any = await api.request("/auth/me");
          if (me && !cancelled) {
            setUser({
              id: me.operator_id ?? me.id ?? 0,
              email: me.email ?? "",
              name: me.name,
              business_name: me.business_name,
              provider: "backend",
            });
            setLoading(false);
            return;
          }
        } catch {
          // Token invalid or backend unreachable — clear it
          localStorage.removeItem("callpilot_token");
        }
      }

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
            name: session.user.user_metadata?.full_name ?? session.user.user_metadata?.name,
            provider: "supabase",
          });
        } else if (user?.provider === "supabase") {
          setUser(null);
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
  const signUp = async (email: string, password: string, name?: string, business_name?: string) => {
    // Try Supabase first (works when deployed without backend)
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name, business_name } },
        });
        if (error) throw error;
        if (data.user) {
          setUser({
            id: data.user.id,
            email: data.user.email ?? email,
            name,
            business_name,
            provider: "supabase",
          });
          return { error: null };
        }
      } catch (err: any) {
        // If Supabase fails with a real error (not network), return it
        if (err?.message && !err.message.includes("fetch")) {
          return { error: { message: err.message } };
        }
        // Otherwise fall through to backend
      }
    }

    // Fallback: try Python backend
    try {
      await api.register(email, password, name, business_name);
      setUser({ id: 0, email, name, business_name, provider: "backend" });
      return { error: null };
    } catch (error: any) {
      const errorMsg = error.message || error.detail || "Registration failed";
      return { error: { message: errorMsg } };
    }
  };

  // ── Sign In ──
  const signIn = async (email: string, password: string) => {
    // Try Supabase first
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          setUser({
            id: data.user.id,
            email: data.user.email ?? email,
            name: data.user.user_metadata?.full_name,
            provider: "supabase",
          });
          return { error: null };
        }
      } catch (err: any) {
        // If Supabase gives a real auth error (invalid credentials), return it
        if (err?.message && !err.message.includes("fetch")) {
          return { error: { message: err.message } };
        }
        // Otherwise fall through to backend
      }
    }

    // Fallback: try Python backend
    try {
      await api.login(email, password);
      setUser({ id: 0, email, provider: "backend" });
      return { error: null };
    } catch (error: any) {
      const errorMsg = error.message || error.detail || "Login failed";
      return { error: { message: errorMsg } };
    }
  };

  // ── Sign Out ──
  const signOut = async () => {
    if (isSupabaseConfigured && supabase && user?.provider === "supabase") {
      await supabase.auth.signOut();
    }
    api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

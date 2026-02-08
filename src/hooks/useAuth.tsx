import { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";

interface User {
  id: number;
  email: string;
  name?: string;
  business_name?: string;
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
    // Check if token exists and validate
    const token = localStorage.getItem('callpilot_token');
    if (token) {
      // Token exists, try to get user info (you might want to add a /auth/me endpoint)
      // For now, we'll just set loading to false
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const signUp = async (email: string, password: string, name?: string, business_name?: string) => {
    try {
      const response = await api.register(email, password, name, business_name);
      // Create a user object from the response
      setUser({ id: 0, email, name, business_name });
      return { error: null };
    } catch (error: any) {
      const errorMsg = error.message || error.detail || 'Registration failed';
      return { error: { message: errorMsg } };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);
      // Create a user object
      setUser({ id: 0, email });
      return { error: null };
    } catch (error: any) {
      const errorMsg = error.message || error.detail || 'Login failed';
      return { error: { message: errorMsg } };
    }
  };

  const signOut = async () => {
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

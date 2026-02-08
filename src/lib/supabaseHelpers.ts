/**
 * Supabase URL & key helpers.
 * Hardcoded fallback ensures the values are never undefined at runtime.
 */
const PROJECT_ID = "cyeiioxtwnxhpvhndfke";

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || `https://${PROJECT_ID}.supabase.co`;

export const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5ZWlpb3h0d254aHB2aG5kZmtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MjE1MjksImV4cCI6MjA4NjA5NzUyOX0.wBcYAWxdE8MTBepuz7xOMTQVds7OiJlYVxyT1q3ScjY";

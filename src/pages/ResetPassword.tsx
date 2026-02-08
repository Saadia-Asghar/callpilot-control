import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Headphones, Lock, ArrowLeft, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import api from "@/lib/api";

type PageState = "loading" | "form" | "success" | "expired";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const { toast } = useToast();

  const [pageState, setPageState] = useState<PageState>("loading");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Check if this is a Supabase auth callback (has access_token fragment or type=recovery)
  const isSupabaseRecovery =
    isSupabaseConfigured &&
    supabase &&
    (window.location.hash.includes("access_token") ||
      searchParams.get("type") === "recovery");

  useEffect(() => {
    const verify = async () => {
      // Supabase recovery flow — token is in the URL fragment, Supabase handles it
      if (isSupabaseRecovery) {
        setPageState("form");
        return;
      }

      // Backend token verification
      if (!token) {
        setPageState("expired");
        return;
      }

      try {
        const result = await api.verifyResetToken(token);
        setPageState(result.valid ? "form" : "expired");
      } catch {
        setPageState("expired");
      }
    };
    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({ title: "Weak password", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", description: "Please make sure both passwords are the same.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      if (isSupabaseRecovery && supabase) {
        // Supabase: update password directly (user is in recovery session)
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
      } else {
        // Backend: reset via token
        await api.resetPassword(token, password);
      }
      setPageState("success");
    } catch (err: any) {
      const msg = err?.message || "Failed to reset password";
      if (msg.includes("expired") || msg.includes("invalid")) {
        setPageState("expired");
      } else {
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-4 left-4 gap-1.5 text-muted-foreground"
        onClick={() => navigate("/auth")}
      >
        <ArrowLeft className="h-4 w-4" /> Back to Login
      </Button>

      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-glow mb-4">
            <Headphones className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {pageState === "success" ? "Password Updated" : pageState === "expired" ? "Link Expired" : "Set New Password"}
          </h1>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-elevated p-8">
          {/* Loading */}
          {pageState === "loading" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Verifying reset link...</p>
            </div>
          )}

          {/* Expired / Invalid */}
          {pageState === "expired" && (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/15">
                <AlertTriangle className="h-7 w-7 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-semibold text-card-foreground">Reset link expired</p>
                <p className="text-xs text-muted-foreground mt-2">
                  This password reset link is invalid or has expired. Please request a new one.
                </p>
              </div>
              <Button
                className="gradient-primary text-primary-foreground border-0"
                onClick={() => navigate("/forgot-password")}
              >
                Request New Link
              </Button>
            </div>
          )}

          {/* Form */}
          {pageState === "form" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs text-muted-foreground">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    autoComplete="new-password"
                    autoFocus
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-xs text-muted-foreground">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    autoComplete="new-password"
                  />
                </div>
              </div>
              {password && password.length < 6 && (
                <p className="text-xs text-destructive">Password must be at least 6 characters</p>
              )}
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-destructive">Passwords don't match</p>
              )}
              <Button
                type="submit"
                className="w-full gradient-primary text-primary-foreground border-0"
                disabled={submitting || password.length < 6 || password !== confirmPassword}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Reset Password
              </Button>
            </form>
          )}

          {/* Success */}
          {pageState === "success" && (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
                <CheckCircle2 className="h-7 w-7 text-success" />
              </div>
              <div>
                <p className="text-sm font-semibold text-card-foreground">Password updated!</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Your password has been reset successfully. You can now log in with your new password.
                </p>
              </div>
              <Button
                className="gradient-primary text-primary-foreground border-0"
                onClick={() => navigate("/auth")}
              >
                Go to Login
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

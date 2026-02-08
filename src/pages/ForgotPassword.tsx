import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Headphones, Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Missing email", description: "Please enter your email address.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch {
      // Always show success to avoid revealing if email exists
      setSent(true);
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
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-glow mb-4">
            <Headphones className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Reset Password</h1>
          <p className="text-sm text-muted-foreground mt-1">Enter your email and we'll send you a reset link</p>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-elevated p-8 space-y-6">
          {sent ? (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
                <CheckCircle2 className="h-7 w-7 text-success" />
              </div>
              <div>
                <p className="text-sm font-semibold text-card-foreground">Check your email</p>
                <p className="text-xs text-muted-foreground mt-2">
                  If an account exists for <strong>{email}</strong>, you'll receive a password reset link shortly.
                </p>
                <p className="text-xs text-muted-foreground mt-1">The link expires in 15 minutes.</p>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => { setSent(false); setEmail(""); }}>Try another email</Button>
                <Button size="sm" className="gradient-primary text-primary-foreground border-0" onClick={() => navigate("/auth")}>Back to Login</Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs text-muted-foreground">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="operator@callpilot.ai" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" autoComplete="email" autoFocus />
                </div>
              </div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground border-0" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Send Reset Link
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Remember your password?{" "}
          <button onClick={() => navigate("/auth")} className="text-primary hover:underline font-medium">Log in</button>
        </p>
      </div>
    </div>
  );
}

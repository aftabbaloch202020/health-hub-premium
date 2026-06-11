import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset Password — Darman STORE" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase puts the recovery session in the URL hash; getSession resolves it.
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return toast.error("Passwords don't match");
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated. Please sign in.");
      await supabase.auth.signOut();
      navigate({ to: "/auth" });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md bg-card rounded-3xl shadow-elegant p-8">
        <Link to="/" className="flex items-center gap-2 mb-6 justify-center">
          <div className="w-11 h-11 rounded-xl bg-gradient-cta grid place-items-center shadow-glow">
            <i className="fa-solid fa-key text-primary-foreground text-xl" />
          </div>
          <span className="font-extrabold text-xl">Set a new password</span>
        </Link>
        {!ready ? (
          <p className="text-center text-sm text-muted-foreground">Waiting for recovery session… open this page from the link in your email.</p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="New password" className="w-full px-4 py-3 rounded-xl bg-muted outline-none focus:ring-2 focus:ring-primary/40" />
            <input type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm new password" className="w-full px-4 py-3 rounded-xl bg-muted outline-none focus:ring-2 focus:ring-primary/40" />
            <button disabled={loading} className="w-full py-3 rounded-xl bg-gradient-cta text-primary-foreground font-bold shadow-glow disabled:opacity-60">
              {loading ? <i className="fa-solid fa-spinner animate-spin" /> : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
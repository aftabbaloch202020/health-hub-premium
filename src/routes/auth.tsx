import { useState, useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Admin Sign In — Darman STORE" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/admin" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        toast.success("Account created. You can sign in now.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/admin" });
      }
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
            <i className="fa-solid fa-prescription-bottle-medical text-primary-foreground text-xl" />
          </div>
          <span className="font-extrabold text-xl">Darman STORE</span>
        </Link>
        <h1 className="text-2xl font-extrabold text-center">Admin {mode === "signin" ? "Sign in" : "Sign up"}</h1>
        <p className="text-sm text-muted-foreground text-center mt-1 mb-6">Manage orders and inventory</p>

        <form onSubmit={submit} className="space-y-3">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Email" className="w-full px-4 py-3 rounded-xl bg-muted outline-none focus:ring-2 focus:ring-primary/40" />
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 6 chars)" className="w-full px-4 py-3 rounded-xl bg-muted outline-none focus:ring-2 focus:ring-primary/40" />
          <button disabled={loading} className="w-full py-3 rounded-xl bg-gradient-cta text-primary-foreground font-bold shadow-glow disabled:opacity-60">
            {loading ? <i className="fa-solid fa-spinner animate-spin" /> : mode === "signin" ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="w-full text-center text-sm text-muted-foreground mt-4 hover:text-primary">
          {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
        <p className="text-xs text-center text-muted-foreground mt-4">
          The first user to sign up will be granted admin access automatically.
        </p>
      </div>
    </div>
  );
}
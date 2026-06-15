import { useState, useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Darman STORE" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/orders" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        if (password.length < 6) throw new Error("Password must be at least 6 characters");
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${window.location.origin}/orders`,
            data: { full_name: fullName, phone },
          },
        });
        if (error) throw error;
        toast.success("Account created. You can sign in now.");
        setMode("signin");
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/orders" });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Password reset link sent. Check your email.");
        setMode("signin");
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const title = mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Reset password";

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-background to-muted p-3 sm:p-4">
      <div className="w-full max-w-md bg-card rounded-2xl sm:rounded-3xl shadow-elegant p-5 sm:p-8">
        <Link to="/" className="flex items-center gap-2 mb-6 justify-center">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-cta grid place-items-center shadow-glow">
            <i className="fa-solid fa-prescription-bottle-medical text-primary-foreground text-lg sm:text-xl" />
          </div>
          <span className="font-extrabold text-lg sm:text-xl">Darman STORE</span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-extrabold text-center">{title}</h1>
        <p className="text-sm text-muted-foreground text-center mt-1 mb-4 sm:mb-6">
          {mode === "forgot" ? "We'll email you a reset link" : "Welcome back to your pharmacy"}
        </p>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <>
              <input required value={fullName} onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name" className={inp} />
              <input value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone (optional)" className={inp} />
            </>
          )}
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Email" className={inp} />
          {mode !== "forgot" && (
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 6 chars)" className={inp} />
          )}
          <button disabled={loading} className="w-full py-3 rounded-xl bg-gradient-cta text-primary-foreground font-bold shadow-glow disabled:opacity-60">
            {loading ? <i className="fa-solid fa-spinner animate-spin" /> : mode === "signin" ? "Sign In" : mode === "signup" ? "Sign Up" : "Send reset link"}
          </button>
        </form>

        <div className="mt-4 flex flex-col gap-1 text-sm text-center">
          {mode === "signin" && (
            <>
              <button onClick={() => setMode("signup")} className="text-muted-foreground hover:text-primary">Need an account? Sign up</button>
              <button onClick={() => setMode("forgot")} className="text-muted-foreground hover:text-primary">Forgot password?</button>
            </>
          )}
          {mode !== "signin" && (
            <button onClick={() => setMode("signin")} className="text-muted-foreground hover:text-primary">Back to sign in</button>
          )}
        </div>
        <p className="text-xs text-center text-muted-foreground mt-4">
          The first registered user is granted admin access to <Link to="/admin" className="text-primary">/admin</Link>.
        </p>
      </div>
    </div>
  );
}

const inp = "w-full px-4 py-3 rounded-xl bg-muted outline-none focus:ring-2 focus:ring-primary/40";
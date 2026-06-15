import { useEffect, useState } from "react";

const KEY = "darman_user";

export function getStoredUser(): { name: string; email: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(KEY);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}

export default function LoginModal({
  open,
  onClose,
  onAuth,
}: {
  open: boolean;
  onClose: () => void;
  onAuth: (user: { name: string; email: string } | null) => void;
}) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setName(""); setEmail(""); setPassword(""); setLoading(false); setMode("login"); setError("");
    }
  }, [open]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password || (mode === "signup" && !name)) {
      setError("Please fill in all fields"); return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter a valid email"); return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters"); return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const user = { name: mode === "signup" ? name : email.split("@")[0], email };
    localStorage.setItem(KEY, JSON.stringify(user));
    onAuth(user);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-foreground/50 backdrop-blur-sm p-4 animate-in fade-in" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="relative w-full max-w-md bg-card rounded-2xl shadow-elegant overflow-hidden border border-border">
        <div className="bg-gradient-cta p-6 text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-background/20 grid place-items-center">
              <i className="fa-solid fa-user-shield text-xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{mode === "login" ? "Welcome back" : "Create account"}</h3>
              <p className="text-sm opacity-90">{mode === "login" ? "Sign in to your Darman STORE account" : "Join Darman STORE today"}</p>
            </div>
          </div>
        </div>
        <form onSubmit={submit} className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
              <i className="fa-solid fa-circle-exclamation" />{error}
            </div>
          )}
          {mode === "signup" && (
            <div>
              <label className="text-sm font-medium block mb-1.5">Full name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          )}
          <div>
            <label className="text-sm font-medium block mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 rounded-lg bg-gradient-cta text-primary-foreground font-semibold shadow-glow hover-lift disabled:opacity-60">
            {loading ? <><i className="fa-solid fa-spinner fa-spin mr-2" />Please wait…</> : mode === "login" ? "Sign in" : "Create account"}
          </button>
          <p className="text-center text-sm text-muted-foreground">
            {mode === "login" ? "New to Darman STORE? " : "Already have an account? "}
            <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-primary font-semibold hover:underline">
              {mode === "login" ? "Create one" : "Sign in"}
            </button>
          </p>
        </form>
        <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 w-9 h-9 rounded-full bg-background/20 hover:bg-background/30 text-primary-foreground grid place-items-center">
          <i className="fa-solid fa-xmark" />
        </button>
      </div>
    </div>
  );
}
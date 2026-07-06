import { Link } from "@tanstack/react-router";
import { useEffect } from "react";

export default function AiLoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center p-4 bg-background/70 backdrop-blur-sm animate-fade-up" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-card rounded-3xl shadow-elegant p-8 text-center relative">
        <button onClick={onClose} aria-label="Close" className="absolute top-3 right-3 w-9 h-9 rounded-full hover:bg-muted grid place-items-center">
          <i className="fa-solid fa-xmark" />
        </button>
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-cta grid place-items-center shadow-glow mb-4">
          <i className="fa-solid fa-lock text-2xl text-primary-foreground" />
        </div>
        <h3 className="text-2xl font-extrabold mb-2">AI Features are protected</h3>
        <p className="text-sm text-muted-foreground mb-6">Please log in or create an account to access AI features.</p>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/auth" search={{ redirect: "/ai-features" }} onClick={onClose} className="px-4 py-3 rounded-xl bg-gradient-cta text-primary-foreground font-semibold shadow-glow">
            <i className="fa-solid fa-right-to-bracket mr-2" />Log in
          </Link>
          <Link to="/auth" search={{ redirect: "/ai-features" }} onClick={onClose} className="px-4 py-3 rounded-xl bg-muted font-semibold hover:bg-muted/70">
            <i className="fa-solid fa-user-plus mr-2" />Register
          </Link>
        </div>
        <p className="text-xs text-muted-foreground mt-4">New accounts get 1 free AI usage. After that, a subscription is required.</p>
      </div>
    </div>
  );
}
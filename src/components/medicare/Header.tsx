import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { BRAND, categories, products } from "@/data/products";
import { useCart, useWishlist } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/client";
export default function Header({ onCartOpen }: { onCartOpen: () => void }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { count } = useCart();
  const { ids } = useWishlist();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState<"en-US" | "ur-PK">("en-US");
  const recogRef = useRef<any>(null);
  const [dark, setDark] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [userMenu, setUserMenu] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
      const authUser = data.session?.user;
      setUser(authUser ? {
        name: String(authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "User"),
        email: authUser.email || "",
      } : null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setHasSession(!!s);
      const authUser = s?.user;
      setUser(authUser ? {
        name: String(authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "User"),
        email: authUser.email || "",
      } : null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    setDark(saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, []);

  const goAiFeatures = () => {
    if (hasSession) navigate({ to: "/ai-features" });
    else navigate({ to: "/auth", search: { redirect: "/ai-features" } });
  };

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    setUser(null);
    setHasSession(false);
    setUserMenu(false);
    navigate({ to: "/auth", replace: true });
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const startVoice = () => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Voice search isn't supported in this browser. Try Chrome or Edge.");
      return;
    }
    if (listening) {
      recogRef.current?.stop();
      return;
    }
    const rec = new SR();
    rec.lang = voiceLang;
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => setListening(true);
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.onresult = (e: any) => {
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) text += e.results[i][0].transcript;
      setQ(text);
    };
    recogRef.current = rec;
    try { rec.start(); } catch { /* already started */ }
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", dark);
    root.style.colorScheme = dark ? "dark" : "light";
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const suggestions = q.length > 1
    ? products.filter(p => p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 5)
    : [];

  return (
    <>
    <header className={`sticky top-0 z-50 transition-smooth ${scrolled ? "glass shadow-soft" : "bg-background"}`}>
      {/* Topbar */}
      <div className="hidden md:block bg-gradient-cta text-primary-foreground text-xs">
        <div className="container mx-auto px-4 py-2 flex justify-between">
          <span><i className="fa-solid fa-truck-fast mr-2" />Free delivery on orders over 3000</span>
          <div className="flex gap-5">
            <span><i className="fa-solid fa-headset mr-2" />{BRAND.phone}</span>
            <span><i className="fa-solid fa-location-dot mr-2" />Deliver to: New York 10001</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-3 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-11 h-11 rounded-xl bg-gradient-cta grid place-items-center shadow-glow">
            <i className="fa-solid fa-prescription-bottle-medical text-primary-foreground text-xl" />
          </div>
          <div className="leading-tight">
            <div className="font-bold text-lg">{BRAND.name}</div>
            <div className="text-[10px] text-muted-foreground -mt-0.5">{BRAND.tagline}</div>
          </div>
        </Link>

        {/* Search */}
        <div className="hidden md:flex flex-1 max-w-2xl relative">
          <div className="flex w-full items-center glass rounded-full px-2 py-1 shadow-soft">
            <select className="bg-transparent text-sm px-3 py-2 outline-none border-r border-border/50">
              <option>All</option>
              {categories.slice(0, 6).map(c => <option key={c.name}>{c.name}</option>)}
            </select>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search medicines, vitamins, brands…"
              className="flex-1 bg-transparent px-4 py-2 outline-none text-sm"
            />
            <select
              value={voiceLang}
              onChange={e => setVoiceLang(e.target.value as any)}
              className="bg-transparent text-xs outline-none px-2 hidden lg:block"
              aria-label="Voice language"
            >
              <option value="en-US">EN</option>
              <option value="ur-PK">اردو</option>
            </select>
            <button
              type="button"
              onClick={startVoice}
              aria-label={listening ? "Stop voice search" : "Start voice search"}
              aria-pressed={listening}
              className={`relative w-10 h-10 rounded-full grid place-items-center transition-smooth ${
                listening
                  ? "bg-destructive text-destructive-foreground shadow-glow"
                  : "bg-secondary text-secondary-foreground hover:scale-105"
              }`}
            >
              {listening && (
                <>
                  <span className="absolute inset-0 rounded-full bg-destructive/40 animate-ping" />
                  <span className="absolute inset-[-6px] rounded-full border-2 border-destructive/40 animate-pulse" />
                </>
              )}
              <i className={`fa-solid ${listening ? "fa-waveform-lines" : "fa-microphone"} relative z-10`} />
            </button>
            <button className="ml-1 px-5 h-10 rounded-full bg-gradient-cta text-primary-foreground font-medium text-sm">
              <i className="fa-solid fa-magnifying-glass mr-2" />Search
            </button>
          </div>
          {suggestions.length > 0 && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-card rounded-2xl shadow-elegant overflow-hidden z-50 animate-fade-up">
              {suggestions.map(p => (
                <button key={p.id} onClick={() => setQ("")} className="w-full flex items-center gap-3 p-3 hover:bg-muted text-left">
                  <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.brand}</div>
                  </div>
                  <span className="font-semibold text-primary">${p.price}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={goAiFeatures}
            className="hidden sm:inline-flex items-center gap-2 px-4 h-10 rounded-full bg-gradient-cta text-primary-foreground font-semibold text-sm shadow-glow hover:scale-[1.02] transition-smooth"
          >
            <i className="fa-solid fa-wand-magic-sparkles" /> AI Features
          </button>
          <button
            onClick={goAiFeatures}
            aria-label="AI Features"
            className="sm:hidden w-10 h-10 rounded-full bg-gradient-cta text-primary-foreground grid place-items-center shadow-glow"
          >
            <i className="fa-solid fa-wand-magic-sparkles" />
          </button>
          <button onClick={() => setDark(!dark)} className="w-10 h-10 rounded-full hover:bg-muted grid place-items-center" aria-label="Toggle theme">
            <i className={`fa-solid ${dark ? "fa-sun" : "fa-moon"}`} />
          </button>
          <div className="hidden sm:block relative">
            <button
              onClick={() => (user ? setUserMenu(v => !v) : navigate({ to: "/auth" }))}
              className="w-10 h-10 rounded-full hover:bg-muted grid place-items-center"
              aria-label="Account"
            >
              {user ? (
                <span className="w-8 h-8 rounded-full bg-gradient-cta text-primary-foreground text-sm font-bold grid place-items-center">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <i className="fa-solid fa-user" />
              )}
            </button>
            {user && userMenu && (
              <div className="absolute right-0 top-12 w-56 bg-card border border-border rounded-xl shadow-elegant overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-border">
                  <div className="text-sm font-semibold truncate">{user.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                </div>
                <Link to="/dashboard" onClick={() => setUserMenu(false)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted flex items-center gap-2">
                  <i className="fa-solid fa-gauge-high" />My dashboard
                </Link>
                <Link to="/orders" onClick={() => setUserMenu(false)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted flex items-center gap-2">
                  <i className="fa-solid fa-bag-shopping" />My orders
                </Link>
                <Link to="/subscribe" onClick={() => setUserMenu(false)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted flex items-center gap-2">
                  <i className="fa-solid fa-crown" />Subscription
                </Link>
                <Link to="/auth" onClick={() => setUserMenu(false)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted flex items-center gap-2">
                  <i className="fa-solid fa-right-to-bracket" />Account / Sign in
                </Link>
                <button
                  onClick={signOut}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted flex items-center gap-2"
                >
                  <i className="fa-solid fa-arrow-right-from-bracket" />Sign out
                </button>
              </div>
            )}
          </div>
          <button className="relative w-10 h-10 rounded-full hover:bg-muted grid place-items-center" aria-label="Wishlist">
            <i className="fa-solid fa-heart" />
            {ids.length > 0 && <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] grid place-items-center font-bold">{ids.length}</span>}
          </button>
          <button onClick={onCartOpen} className="relative w-10 h-10 rounded-full hover:bg-muted grid place-items-center" aria-label="Cart">
            <i className="fa-solid fa-bag-shopping" />
            {count > 0 && <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] grid place-items-center font-bold pulse-ring">{count}</span>}
          </button>
          <button onClick={() => setOpen(!open)} className="md:hidden w-10 h-10 rounded-full hover:bg-muted grid place-items-center">
            <i className={`fa-solid ${open ? "fa-xmark" : "fa-bars"}`} />
          </button>
        </div>
      </div>

      {/* Category nav */}
      <nav className="hidden md:block border-t border-border/60">
        <div className="container mx-auto px-4 flex items-center gap-1 overflow-x-auto scrollbar-hide">
          <button className="flex items-center gap-2 px-4 py-3 bg-gradient-cta text-primary-foreground font-medium text-sm rounded-t-xl">
            <i className="fa-solid fa-grip" /> All Categories
          </button>
          {categories.slice(0, 8).map(c => (
            <a key={c.name} href="#products" className="px-4 py-3 text-sm whitespace-nowrap hover:text-primary transition-smooth">
              {c.name}
            </a>
          ))}
          <button onClick={goAiFeatures} className="px-4 py-3 text-sm font-semibold text-primary whitespace-nowrap">
            <i className="fa-solid fa-wand-magic-sparkles mr-1" /> AI Features
          </button>
          <a href="#deals" className="ml-auto px-4 py-3 text-sm font-semibold text-destructive whitespace-nowrap">
            <i className="fa-solid fa-fire mr-1" /> Hot Deals
          </a>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-card animate-fade-up">
          <div className="p-4 space-y-2">
            <input placeholder="Search…" className="w-full rounded-full px-4 py-3 bg-muted outline-none" />
            <div className="flex items-center gap-2 pt-2">
              {user ? (
                <>
                  <span className="w-10 h-10 rounded-full bg-gradient-cta text-primary-foreground text-sm font-bold grid place-items-center shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate">{user.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => { setOpen(false); navigate({ to: "/auth" }); }}
                  className="w-full rounded-xl bg-gradient-cta text-primary-foreground font-medium text-sm px-4 py-3 flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-right-to-bracket" /> Sign in / Register
                </button>
              )}
            </div>
            {user && (
              <div className="grid grid-cols-1 gap-2">
                <Link to="/dashboard" onClick={() => setOpen(false)}
                  className="flex items-center gap-2 p-3 rounded-xl bg-muted text-sm">
                  <i className="fa-solid fa-gauge-high text-primary" /> Dashboard
                </Link>
                <Link to="/subscribe" onClick={() => setOpen(false)}
                  className="flex items-center gap-2 p-3 rounded-xl bg-muted text-sm">
                  <i className="fa-solid fa-crown text-primary" /> Subscription
                </Link>
                <Link to="/orders" onClick={() => setOpen(false)}
                  className="flex items-center gap-2 p-3 rounded-xl bg-muted text-sm">
                  <i className="fa-solid fa-bag-shopping text-primary" /> My Orders
                </Link>
                <button
                  onClick={async () => { setOpen(false); await signOut(); }}
                  className="flex items-center gap-2 p-3 rounded-xl bg-muted text-sm text-left"
                >
                  <i className="fa-solid fa-arrow-right-from-bracket text-primary" /> Sign out
                </button>
              </div>
            )}
            <button onClick={() => { setOpen(false); goAiFeatures(); }}
              className="w-full flex items-center gap-2 p-3 rounded-xl bg-gradient-cta text-primary-foreground text-sm font-semibold">
              <i className="fa-solid fa-wand-magic-sparkles" /> AI Features
            </button>
            <div className="grid grid-cols-2 gap-2 pt-2">
              {categories.slice(0, 8).map(c => (
                <a key={c.name} href="#products" className="flex items-center gap-2 p-3 rounded-xl bg-muted text-sm">
                  <i className={`fa-solid ${c.icon} text-primary`} />{c.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
    </>
  );
}

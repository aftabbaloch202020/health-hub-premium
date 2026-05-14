import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { BRAND, categories, products } from "@/data/products";
import { useCart, useWishlist } from "@/lib/cart";
import logo from "@/assets/logo.jpg";

export default function Header({ onCartOpen }: { onCartOpen: () => void }) {
  const { count } = useCart();
  const { ids } = useWishlist();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState<"en-US" | "ur-PK">("en-US");
  const recogRef = useRef<any>(null);
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [scrolled, setScrolled] = useState(false);

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
          <img src={logo} alt={BRAND.name} className="h-16 md:h-20 w-auto object-contain" />
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
          <button onClick={() => setDark(!dark)} className="w-10 h-10 rounded-full hover:bg-muted grid place-items-center" aria-label="Toggle theme">
            <i className={`fa-solid ${dark ? "fa-sun" : "fa-moon"}`} />
          </button>
          <button className="hidden sm:grid w-10 h-10 rounded-full hover:bg-muted place-items-center" aria-label="Account">
            <i className="fa-solid fa-user" />
          </button>
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
  );
}

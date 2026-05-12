import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { BRAND, categories, products } from "@/data/products";
import { useCart, useWishlist } from "@/lib/cart";

export default function Header({ onCartOpen }: { onCartOpen: () => void }) {
  const { count } = useCart();
  const { ids } = useWishlist();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const suggestions = q.length > 1
    ? products.filter(p => p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 5)
    : [];

  return (
    <header className={`sticky top-0 z-50 transition-smooth ${scrolled ? "glass shadow-soft" : "bg-background"}`}>
      {/* Topbar */}
      <div className="hidden md:block bg-gradient-cta text-primary-foreground text-xs">
        <div className="container mx-auto px-4 py-2 flex justify-between">
          <span><i className="fa-solid fa-truck-fast mr-2" />Free delivery on orders over $30</span>
          <div className="flex gap-5">
            <span><i className="fa-solid fa-headset mr-2" />{BRAND.phone}</span>
            <span><i className="fa-solid fa-location-dot mr-2" />Deliver to: New York 10001</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-3 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-cta grid place-items-center shadow-glow">
            <i className="fa-solid fa-prescription-bottle-medical text-primary-foreground text-lg" />
          </div>
          <div className="leading-tight">
            <div className="font-bold text-lg gradient-text">{BRAND.name}</div>
            <div className="text-[10px] text-muted-foreground hidden sm:block">{BRAND.tagline}</div>
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
            <button className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground grid place-items-center" aria-label="Voice search">
              <i className="fa-solid fa-microphone" />
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

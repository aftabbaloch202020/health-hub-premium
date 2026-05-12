import { useEffect, useState } from "react";
import { products } from "@/data/products";

function useCountdown(target: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const diff = Math.max(0, target - now);
  const h = Math.floor(diff / 3.6e6).toString().padStart(2, "0");
  const m = Math.floor((diff % 3.6e6) / 6e4).toString().padStart(2, "0");
  const s = Math.floor((diff % 6e4) / 1000).toString().padStart(2, "0");
  return [h, m, s];
}

export default function Deals() {
  const [h, m, s] = useCountdown(Date.now() + 1000 * 60 * 60 * 9);
  const featured = products[1];
  return (
    <section id="deals" className="container mx-auto px-4 py-12">
      <div className="relative rounded-3xl overflow-hidden bg-gradient-cta text-primary-foreground p-8 md:p-12 shadow-elegant">
        <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-white/10 animate-float" />
        <div className="absolute -left-12 -bottom-12 w-56 h-56 rounded-full bg-white/10" />
        <div className="relative grid md:grid-cols-2 gap-8 items-center">
          <div>
            <span className="inline-flex items-center gap-2 glass-dark px-4 py-1.5 rounded-full text-xs font-semibold">
              <i className="fa-solid fa-bolt" /> Flash Deal of the Day
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold mt-4 leading-tight">Up to 50% off<br />Premium Vitamins</h2>
            <p className="opacity-90 mt-3 max-w-md">Limited stock — restock by trusted brands at the lowest prices of the season.</p>
            <div className="flex gap-3 mt-6">
              {[["Hours", h], ["Min", m], ["Sec", s]].map(([l, v]) => (
                <div key={l} className="glass-dark rounded-2xl px-5 py-3 text-center min-w-[78px]">
                  <div className="text-3xl font-extrabold tabular-nums">{v}</div>
                  <div className="text-[10px] uppercase tracking-widest opacity-80">{l}</div>
                </div>
              ))}
            </div>
            <button className="mt-6 px-7 py-3.5 rounded-full bg-card text-foreground font-semibold shadow-glow hover-lift">
              Shop the Deal <i className="fa-solid fa-arrow-right ml-2" />
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-white/20 rounded-full blur-3xl" />
            <img src={featured.image} alt={featured.name} className="relative w-full max-w-sm mx-auto animate-float drop-shadow-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}

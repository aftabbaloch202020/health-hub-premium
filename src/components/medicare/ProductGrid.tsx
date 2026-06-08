import { useEffect, useMemo, useState } from "react";
import {
  medicines as ALL,
  allCategories,
  allManufacturers,
  formatPKR,
  searchMedicines,
  similarMedicines,
  type Medicine,
} from "@/lib/medicines";
import { useCart, useWishlist } from "@/lib/cart";

const PAGE_SIZE = 12;

export default function ProductGrid() {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [brand, setBrand] = useState<string | null>(null);
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState(15000);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [active, setActive] = useState<Medicine | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 200);
    return () => clearTimeout(t);
  }, [q]);

  const filtered = useMemo(() => {
    let list = ALL;
    if (cat) list = list.filter(m => m.category === cat);
    if (brand) list = list.filter(m => m.brand === brand);
    if (minRating > 0) list = list.filter(m => m.rating >= minRating);
    list = list.filter(m => m.pricePKR <= maxPrice);
    if (inStockOnly) list = list.filter(m => m.inStock);
    if (debounced) list = searchMedicines(list, debounced);
    return list;
  }, [cat, brand, minRating, maxPrice, inStockOnly, debounced]);

  useEffect(() => setVisible(PAGE_SIZE), [debounced, cat, brand, minRating, maxPrice, inStockOnly]);

  const clearAll = () => {
    setQ(""); setCat(null); setBrand(null); setMinRating(0); setMaxPrice(15000); setInStockOnly(false);
  };

  return (
    <section id="products" className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Pharmacy Catalog</span>
          <h2 className="text-3xl md:text-4xl font-extrabold mt-1">All Medicines</h2>
          <p className="text-sm text-muted-foreground mt-2">
            {filtered.length} medicines available · prices in PKR
          </p>
        </div>
        <div className="relative w-full md:w-96">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search by name, brand, generic, manufacturer…"
            className="w-full h-12 pl-11 pr-10 rounded-2xl bg-card border border-border shadow-card outline-none focus:ring-2 focus:ring-primary/40 text-sm"
          />
          {q && (
            <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-6">
        {/* Filters */}
        <aside className="bg-card rounded-3xl p-5 shadow-card h-fit space-y-5 lg:sticky lg:top-24">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm uppercase tracking-wide">Filters</h3>
            <button onClick={clearAll} className="text-xs text-primary font-semibold hover:underline">Clear all</button>
          </div>

          <div>
            <div className="text-xs font-semibold mb-2 text-muted-foreground uppercase">Category</div>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              <button onClick={() => setCat(null)} className={`w-full text-left text-sm px-2 py-1.5 rounded-lg ${!cat ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted"}`}>All categories</button>
              {allCategories.map(c => (
                <button key={c} onClick={() => setCat(c)} className={`w-full text-left text-sm px-2 py-1.5 rounded-lg ${cat === c ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted"}`}>{c}</button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold mb-2 text-muted-foreground uppercase">Manufacturer</div>
            <select value={brand ?? ""} onChange={e => setBrand(e.target.value || null)}
              className="w-full h-10 px-3 rounded-xl bg-muted border border-border text-sm">
              <option value="">All manufacturers</option>
              {allManufacturers.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div>
            <div className="text-xs font-semibold mb-2 text-muted-foreground uppercase flex justify-between">
              <span>Max price</span><span className="text-primary">{formatPKR(maxPrice)}</span>
            </div>
            <input type="range" min={500} max={15000} step={100} value={maxPrice}
              onChange={e => setMaxPrice(Number(e.target.value))} className="w-full accent-primary" />
          </div>

          <div>
            <div className="text-xs font-semibold mb-2 text-muted-foreground uppercase">Minimum rating</div>
            <div className="flex gap-1">
              {[0, 3, 4, 4.5].map(r => (
                <button key={r} onClick={() => setMinRating(r)}
                  className={`flex-1 text-xs py-1.5 rounded-lg ${minRating === r ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent"}`}>
                  {r === 0 ? "Any" : `${r}★+`}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={inStockOnly} onChange={e => setInStockOnly(e.target.checked)}
              className="w-4 h-4 accent-primary" />
            In stock only
          </label>
        </aside>

        {/* Results */}
        <div>
          {filtered.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-12 text-center bg-card/50">
              <i className="fa-solid fa-pills text-5xl text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">No medicines found</h3>
              <p className="text-muted-foreground">Try different keywords or clear the filters.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.slice(0, visible).map(m => (
                  <MedCard key={m.id} m={m} onOpen={() => setActive(m)} />
                ))}
              </div>
              {visible < filtered.length && (
                <div className="text-center mt-8">
                  <button onClick={() => setVisible(v => v + PAGE_SIZE)}
                    className="px-8 py-3 rounded-2xl bg-gradient-cta text-primary-foreground font-semibold shadow-soft hover:scale-105 transition-smooth">
                    Load more ({filtered.length - visible} left)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {active && <MedDetail m={active} onClose={() => setActive(null)} onPick={setActive} />}
    </section>
  );
}

function MedCard({ m, onOpen }: { m: Medicine; onOpen: () => void }) {
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const liked = has(m.id);
  const discount = m.oldPricePKR ? Math.round(((m.oldPricePKR - m.pricePKR) / m.oldPricePKR) * 100) : 0;
  return (
    <div className="group bg-card rounded-3xl overflow-hidden shadow-card hover-lift transition-smooth flex flex-col">
      <div className="relative aspect-square bg-muted/40 cursor-pointer" onClick={onOpen}>
        {m.badge && <span className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gradient-cta text-primary-foreground">{m.badge}</span>}
        {discount > 0 && <span className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full text-[10px] font-bold bg-destructive text-destructive-foreground">-{discount}%</span>}
        <img src={m.image} alt={m.name} loading="lazy" className="w-full h-full object-contain p-4 transition-smooth group-hover:scale-110" />
        {!m.inStock && <div className="absolute inset-0 bg-background/70 grid place-items-center font-bold text-destructive">Out of Stock</div>}
        <button onClick={(e) => { e.stopPropagation(); toggle(m.id); }}
          className={`absolute bottom-3 right-3 w-9 h-9 rounded-full grid place-items-center shadow-soft ${liked ? "bg-destructive text-destructive-foreground" : "glass"}`}>
          <i className={`fa-${liked ? "solid" : "regular"} fa-heart text-sm`} />
        </button>
      </div>
      <div className="p-4 flex-1 flex flex-col gap-2">
        <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">{m.brand}</div>
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 min-h-[2.5rem]">{m.name}</h3>
        <div className="flex items-center gap-1 text-xs">
          <span className="flex text-warning">
            {Array.from({ length: 5 }).map((_, i) => (
              <i key={i} className={`fa-${i < Math.floor(m.rating) ? "solid" : "regular"} fa-star text-[11px]`} />
            ))}
          </span>
          <span className="text-muted-foreground">({m.reviews})</span>
        </div>
        <div className="flex items-end justify-between pt-1">
          <div>
            <div className="text-base font-extrabold text-primary">{formatPKR(m.pricePKR)}</div>
            {m.oldPricePKR && <div className="text-xs text-muted-foreground line-through">{formatPKR(m.oldPricePKR)}</div>}
          </div>
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${m.inStock ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
            {m.inStock ? "In Stock" : "Unavailable"}
          </span>
        </div>
        <div className="flex gap-2 mt-2">
          <button onClick={onOpen} className="flex-1 py-2 rounded-xl text-xs font-semibold bg-muted hover:bg-accent transition-smooth">
            View Details
          </button>
          <button onClick={() => m.inStock && add(m)} disabled={!m.inStock}
            className="flex-1 py-2 rounded-xl text-xs font-semibold bg-gradient-cta text-primary-foreground shadow-soft hover:scale-105 transition-smooth disabled:opacity-40">
            <i className="fa-solid fa-cart-plus mr-1" /> Add
          </button>
        </div>
      </div>
    </div>
  );
}

function MedDetail({ m, onClose, onPick }: { m: Medicine; onClose: () => void; onPick: (m: Medicine) => void }) {
  const { add } = useCart();
  const similar = similarMedicines(m, ALL);
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-card rounded-3xl shadow-card w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="grid md:grid-cols-2 gap-6 p-6">
          <div className="bg-muted/40 rounded-2xl aspect-square grid place-items-center relative">
            <img src={m.image} alt={m.name} className="max-w-full max-h-full object-contain p-6" />
            {!m.inStock && <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold bg-destructive text-destructive-foreground">Out of Stock</span>}
          </div>
          <div className="flex flex-col">
            <div className="flex justify-between items-start gap-2">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">{m.brand}</div>
                <h2 className="text-2xl font-extrabold mt-1">{m.name}</h2>
                <div className="text-sm text-muted-foreground mt-1">Generic: <span className="font-semibold text-foreground">{m.details.genericName}</span></div>
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-full bg-muted hover:bg-accent grid place-items-center">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="flex items-center gap-2 mt-3 text-sm">
              <span className="flex text-warning">
                {Array.from({ length: 5 }).map((_, i) => (
                  <i key={i} className={`fa-${i < Math.floor(m.rating) ? "solid" : "regular"} fa-star text-xs`} />
                ))}
              </span>
              <span className="text-muted-foreground">{m.rating.toFixed(1)} ({m.reviews} reviews)</span>
            </div>

            <div className="flex items-end gap-3 mt-4">
              <div className="text-3xl font-extrabold text-primary">{formatPKR(m.pricePKR)}</div>
              {m.oldPricePKR && <div className="text-sm text-muted-foreground line-through">{formatPKR(m.oldPricePKR)}</div>}
            </div>

            <div className="flex flex-wrap gap-2 mt-3 text-xs">
              <span className={`px-2.5 py-1 rounded-full font-semibold ${m.inStock ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                {m.inStock ? "Available" : "Out of Stock"}
              </span>
              <span className="px-2.5 py-1 rounded-full font-semibold bg-muted">{m.category}</span>
              <span className={`px-2.5 py-1 rounded-full font-semibold ${m.details.prescriptionRequired ? "bg-warning/15 text-warning" : "bg-primary/10 text-primary"}`}>
                {m.details.prescriptionRequired ? "Prescription required" : "OTC - No prescription"}
              </span>
            </div>

            <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{m.details.description}</p>

            <button onClick={() => m.inStock && add(m)} disabled={!m.inStock}
              className="mt-5 py-3 rounded-2xl bg-gradient-cta text-primary-foreground font-bold shadow-soft hover:scale-[1.02] transition-smooth disabled:opacity-40">
              <i className="fa-solid fa-cart-plus mr-2" /> Add to Cart
            </button>
          </div>
        </div>

        <div className="px-6 pb-6 grid md:grid-cols-3 gap-4">
          <Section title="Uses" icon="fa-circle-check">
            <ul className="space-y-1 text-sm">
              {m.details.uses.map(u => <li key={u} className="flex gap-2"><i className="fa-solid fa-check text-primary mt-1 text-xs" />{u}</li>)}
            </ul>
          </Section>
          <Section title="Dosage" icon="fa-prescription-bottle">
            <p className="text-sm text-muted-foreground leading-relaxed">{m.details.dosage}</p>
          </Section>
          <Section title="Side Effects" icon="fa-triangle-exclamation">
            <ul className="space-y-1 text-sm">
              {m.details.sideEffects.map(s => <li key={s} className="flex gap-2"><i className="fa-solid fa-circle text-destructive mt-1.5 text-[6px]" />{s}</li>)}
            </ul>
          </Section>
        </div>

        {(!m.inStock || similar.length > 0) && (
          <div className="px-6 pb-6">
            <h3 className="font-bold mb-3">{m.inStock ? "Similar medicines" : "Alternative medicines in stock"}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {similar.map(s => (
                <button key={s.id} onClick={() => onPick(s)}
                  className="bg-muted/40 rounded-2xl p-3 text-left hover-lift transition-smooth">
                  <img src={s.image} alt={s.name} className="w-full aspect-square object-contain" />
                  <div className="text-xs font-semibold line-clamp-2 mt-2">{s.name}</div>
                  <div className="text-sm font-bold text-primary mt-1">{formatPKR(s.pricePKR)}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-muted/30 rounded-2xl p-4">
      <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><i className={`fa-solid ${icon} text-primary`} />{title}</h4>
      {children}
    </div>
  );
}

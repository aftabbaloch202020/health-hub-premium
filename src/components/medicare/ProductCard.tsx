import type { Product } from "@/data/products";
import { useCart, useWishlist } from "@/lib/cart";

export default function ProductCard({ p }: { p: Product }) {
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const liked = has(p.id);
  const discount = p.oldPrice ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : 0;

  return (
    <div className="group relative bg-card rounded-3xl overflow-hidden shadow-card hover-lift transition-smooth">
      {p.badge && (
        <span className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gradient-cta text-primary-foreground shadow-soft">
          {p.badge}
        </span>
      )}
      {discount > 0 && (
        <span className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full text-[10px] font-bold bg-destructive text-destructive-foreground">
          -{discount}%
        </span>
      )}

      <div className="relative aspect-square bg-muted/40 overflow-hidden">
        <img src={p.image} alt={p.name} loading="lazy"
          className="w-full h-full object-contain p-4 transition-smooth group-hover:scale-110" />
        <div className="absolute right-3 bottom-3 flex flex-col gap-2 opacity-0 translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-smooth">
          <button onClick={() => toggle(p.id)} aria-label="Wishlist"
            className={`w-10 h-10 rounded-full grid place-items-center shadow-soft ${liked ? "bg-destructive text-destructive-foreground" : "glass"}`}>
            <i className={`fa-${liked ? "solid" : "regular"} fa-heart`} />
          </button>
          <button className="w-10 h-10 rounded-full glass grid place-items-center shadow-soft" aria-label="Quick view">
            <i className="fa-regular fa-eye" />
          </button>
          <button className="w-10 h-10 rounded-full glass grid place-items-center shadow-soft" aria-label="Compare">
            <i className="fa-solid fa-code-compare" />
          </button>
        </div>
        {!p.inStock && (
          <div className="absolute inset-0 bg-background/70 grid place-items-center font-bold text-destructive">
            Out of Stock
          </div>
        )}
      </div>

      <div className="p-4 space-y-2">
        <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">{p.brand}</div>
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 min-h-[2.5rem]">{p.name}</h3>
        <div className="flex items-center gap-1 text-xs">
          <span className="flex text-warning">
            {Array.from({ length: 5 }).map((_, i) => (
              <i key={i} className={`fa-${i < Math.floor(p.rating) ? "solid" : "regular"} fa-star text-[11px]`} />
            ))}
          </span>
          <span className="text-muted-foreground">({p.reviews})</span>
        </div>
        <div className="flex items-end justify-between pt-1">
          <div>
            <div className="text-lg font-extrabold text-primary">${p.price}</div>
            {p.oldPrice && <div className="text-xs text-muted-foreground line-through">${p.oldPrice}</div>}
          </div>
          <button onClick={() => p.inStock && add(p)} disabled={!p.inStock}
            className="w-10 h-10 rounded-2xl bg-gradient-cta text-primary-foreground grid place-items-center shadow-soft hover:scale-110 transition-smooth disabled:opacity-40 disabled:cursor-not-allowed">
            <i className="fa-solid fa-plus" />
          </button>
        </div>
      </div>
    </div>
  );
}

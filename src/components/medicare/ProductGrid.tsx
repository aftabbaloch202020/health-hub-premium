import { useState } from "react";
import { products, categories } from "@/data/products";
import ProductCard from "./ProductCard";

export default function ProductGrid() {
  const tabs = ["All", ...Array.from(new Set(products.map(p => p.category)))];
  const [active, setActive] = useState("All");
  const list = active === "All" ? products : products.filter(p => p.category === active);
  return (
    <section id="products" className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Top picks</span>
          <h2 className="text-3xl md:text-4xl font-extrabold mt-1">Featured Products</h2>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {tabs.map(t => (
            <button key={t} onClick={() => setActive(t)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-smooth ${
                active === t ? "bg-gradient-cta text-primary-foreground shadow-soft" : "bg-muted hover:bg-accent"
              }`}>{t}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {list.map(p => <ProductCard key={p.id} p={p} />)}
      </div>
    </section>
  );
}

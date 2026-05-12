import { categories } from "@/data/products";

export default function Categories() {
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="flex items-end justify-between mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Browse by</span>
          <h2 className="text-3xl md:text-4xl font-extrabold mt-1">Shop Categories</h2>
        </div>
        <a href="#" className="text-sm font-semibold text-primary hidden md:inline-flex items-center gap-2 hover:gap-3 transition-smooth">
          View all <i className="fa-solid fa-arrow-right" />
        </a>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 md:gap-5">
        {categories.map((c, i) => (
          <a key={c.name} href="#products"
            className="group relative bg-card rounded-3xl p-5 text-center shadow-card hover-lift cursor-pointer overflow-hidden animate-fade-up"
            style={{ animationDelay: `${i * 40}ms` }}>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-smooth"
              style={{ background: `linear-gradient(135deg, ${c.color}, transparent)` }} />
            <div className="relative">
              <div className="w-14 h-14 mx-auto rounded-2xl grid place-items-center mb-3 transition-smooth group-hover:scale-110"
                style={{ background: `color-mix(in oklab, ${c.color} 15%, white)`, color: c.color }}>
                <i className={`fa-solid ${c.icon} text-2xl`} />
              </div>
              <div className="font-semibold text-sm">{c.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{c.count} items</div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

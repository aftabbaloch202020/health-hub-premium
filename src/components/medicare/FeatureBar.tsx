const items = [
  { icon: "fa-truck-fast", title: "Free Delivery", desc: "On orders over $30" },
  { icon: "fa-shield-halved", title: "100% Genuine", desc: "Authentic medicines" },
  { icon: "fa-rotate-left", title: "Easy Returns", desc: "7-day return policy" },
  { icon: "fa-headset", title: "24/7 Support", desc: "Pharmacist on call" },
];
export default function FeatureBar() {
  return (
    <section className="container mx-auto px-4 -mt-6 relative z-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 glass rounded-3xl p-4 md:p-6 shadow-elegant">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-cta text-primary-foreground grid place-items-center shrink-0 shadow-soft">
              <i className={`fa-solid ${it.icon} text-lg`} />
            </div>
            <div>
              <div className="font-bold text-sm md:text-base">{it.title}</div>
              <div className="text-xs text-muted-foreground">{it.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

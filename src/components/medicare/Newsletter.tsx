import { BRAND } from "@/data/products";
export default function Newsletter() {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="rounded-3xl bg-gradient-hero p-8 md:p-12 text-center shadow-card">
        <i className="fa-solid fa-envelope-open-text text-4xl text-primary mb-4" />
        <h2 className="text-3xl md:text-4xl font-extrabold">Get health tips & exclusive deals</h2>
        <p className="text-muted-foreground mt-2 max-w-lg mx-auto">Join 250,000 subscribers and get a 10% off coupon for your first order from {BRAND.name}.</p>
        <form onSubmit={e => e.preventDefault()} className="mt-6 flex flex-col sm:flex-row max-w-lg mx-auto gap-3">
          <input type="email" required placeholder="you@example.com" className="flex-1 rounded-full px-6 py-3.5 bg-card shadow-soft outline-none focus:ring-2 focus:ring-primary" />
          <button className="px-7 py-3.5 rounded-full bg-gradient-cta text-primary-foreground font-semibold shadow-glow hover-lift">Subscribe</button>
        </form>
      </div>
    </section>
  );
}

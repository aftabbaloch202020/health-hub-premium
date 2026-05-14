import { BRAND } from "@/data/products";
export default function Footer() {
  return (
    <footer className="bg-foreground text-background mt-16">
      <div className="container mx-auto px-4 py-14 grid grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-cta grid place-items-center">
              <i className="fa-solid fa-prescription-bottle-medical text-primary-foreground text-xl" />
            </div>
            <span className="font-bold text-xl">{BRAND.name}</span>
          </div>
          <p className="text-sm opacity-70 max-w-sm">{BRAND.tagline}. Your trusted online pharmacy serving 2M+ customers with care, speed and authenticity.</p>
          <div className="flex gap-3 mt-5">
            {["facebook-f", "instagram", "twitter", "youtube", "whatsapp"].map(i => (
              <a key={i} href="#" className="w-10 h-10 rounded-full bg-background/10 hover:bg-primary grid place-items-center transition-smooth">
                <i className={`fa-brands fa-${i}`} />
              </a>
            ))}
          </div>
          <div className="flex gap-2 mt-6">
            <a href="#" className="px-3 py-2 rounded-xl bg-background/10 flex items-center gap-2 text-xs">
              <i className="fa-brands fa-google-play text-lg" /><div><div className="opacity-70 text-[9px]">GET IT ON</div><div className="font-semibold">Google Play</div></div>
            </a>
            <a href="#" className="px-3 py-2 rounded-xl bg-background/10 flex items-center gap-2 text-xs">
              <i className="fa-brands fa-apple text-lg" /><div><div className="opacity-70 text-[9px]">DOWNLOAD ON</div><div className="font-semibold">App Store</div></div>
            </a>
          </div>
        </div>
        {[
          { title: "Shop", links: ["Medicines", "Vitamins", "Baby Care", "Health Devices", "Beauty"] },
          { title: "Support", links: ["Help Center", "Track Order", "Returns", "Contact Us", "Live Chat"] },
          { title: "Company", links: ["About", "Careers", "Press", "Blog", "Partners"] },
        ].map(col => (
          <div key={col.title}>
            <h4 className="font-bold mb-4">{col.title}</h4>
            <ul className="space-y-2 text-sm opacity-70">
              {col.links.map(l => <li key={l}><a href="#" className="hover:opacity-100 hover:text-primary-glow transition-smooth">{l}</a></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-background/10">
        <div className="container mx-auto px-4 py-5 flex flex-col md:flex-row gap-3 justify-between text-xs opacity-70">
          <div>© 2026 {BRAND.name}. Licensed online pharmacy. All rights reserved.</div>
          <div className="flex gap-3">
            {["cc-visa", "cc-mastercard", "cc-amex", "cc-paypal", "cc-stripe", "cc-apple-pay"].map(b => (
              <i key={b} className={`fa-brands fa-${b} text-2xl`} />
            ))}
          </div>
        </div>
      </div>

      <a href="https://wa.me/" className="fixed bottom-5 right-5 w-14 h-14 rounded-full bg-[#25D366] text-white grid place-items-center shadow-elegant pulse-ring z-40">
        <i className="fa-brands fa-whatsapp text-2xl" />
      </a>
    </footer>
  );
}

import { useState } from "react";
const faqs = [
  { q: "How fast is your delivery?", a: "We deliver within 30 minutes in major cities and same-day across the country. Express pickup is also available from any partner pharmacy." },
  { q: "Are your medicines authentic?", a: "Every product is sourced directly from licensed manufacturers and verified by our team of registered pharmacists. We guarantee 100% authenticity." },
  { q: "Can I order prescription medicines?", a: "Yes. Upload a clear photo of your valid prescription during checkout, and our pharmacists will verify it before dispatch." },
  { q: "What payment methods are accepted?", a: "We accept all major credit/debit cards, digital wallets, cash on delivery, and installment plans through select banks." },
  { q: "How can I return a product?", a: "Most items can be returned within 7 days. Sealed medicines are returnable only if damaged or expired; contact our 24/7 support to initiate." },
];
export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="grid md:grid-cols-2 gap-10">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Help center</span>
          <h2 className="text-3xl md:text-4xl font-extrabold mt-1">Frequently asked questions</h2>
          <p className="text-muted-foreground mt-3">Can't find what you're looking for? Our team of pharmacists is available 24/7 to help.</p>
          <button className="mt-5 px-6 py-3 rounded-full bg-gradient-cta text-primary-foreground font-semibold">
            <i className="fa-solid fa-comments mr-2" />Chat with Pharmacist
          </button>
        </div>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className={`rounded-2xl bg-card shadow-card overflow-hidden transition-smooth ${open === i ? "shadow-elegant" : ""}`}>
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left">
                <span className="font-semibold">{f.q}</span>
                <i className={`fa-solid fa-chevron-down transition-smooth ${open === i ? "rotate-180 text-primary" : ""}`} />
              </button>
              <div className={`grid transition-all duration-300 ${open === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <div className="overflow-hidden">
                  <p className="px-5 pb-5 text-sm text-muted-foreground">{f.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

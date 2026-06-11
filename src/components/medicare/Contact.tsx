import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { sendContactMessage } from "@/lib/contact.functions";
import { toast } from "sonner";

export default function Contact() {
  const send = useServerFn(sendContactMessage);
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof typeof form>(k: K, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await send({ data: form });
      toast.success("Message sent! We'll be in touch soon.");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="contact" className="py-16 bg-muted/40">
      <div className="container mx-auto px-4 grid md:grid-cols-2 gap-10 items-start">
        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">CONTACT US</span>
          <h2 className="text-3xl md:text-4xl font-extrabold mt-3">Get in touch with Darman</h2>
          <p className="text-muted-foreground mt-3 max-w-md">Questions about an order, a prescription, or our services? Send us a message and our team will reply within 24 hours.</p>
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex items-center gap-3"><i className="fa-solid fa-envelope text-primary w-5" /> aftabbaloch202020@gmail.com</div>
            <div className="flex items-center gap-3"><i className="fa-solid fa-phone text-primary w-5" /> +92 300 1234567</div>
            <div className="flex items-center gap-3"><i className="fa-solid fa-location-dot text-primary w-5" /> Karachi, Pakistan</div>
          </div>
        </div>

        <form onSubmit={submit} className="bg-card rounded-3xl shadow-card p-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input required maxLength={120} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Your name *" className={inp} />
            <input required type="email" maxLength={200} value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="Email *" className={inp} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input maxLength={20} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="Phone" className={inp} />
            <input maxLength={140} value={form.subject} onChange={(e) => set("subject", e.target.value)} placeholder="Subject" className={inp} />
          </div>
          <textarea required maxLength={4000} rows={5} value={form.message} onChange={(e) => set("message", e.target.value)} placeholder="How can we help? *" className={inp} />
          <button disabled={busy} className="w-full py-3 rounded-2xl bg-gradient-cta text-primary-foreground font-bold shadow-glow disabled:opacity-60">
            {busy ? <i className="fa-solid fa-spinner animate-spin" /> : <>Send message <i className="fa-solid fa-paper-plane ml-2" /></>}
          </button>
        </form>
      </div>
    </section>
  );
}

const inp = "w-full px-4 py-2.5 rounded-xl bg-muted border border-border outline-none focus:ring-2 focus:ring-primary/40 text-sm";
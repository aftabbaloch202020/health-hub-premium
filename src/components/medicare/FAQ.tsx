import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import pharmacistImg from "@/assets/pharmacist.jpg";
import { askPharmacist } from "@/lib/pharmacist.functions";

type ChatMsg = { role: "user" | "assistant"; content: string };

const faqs = [
  { q: "How fast is your delivery?", a: "We deliver within 30 minutes in major cities and same-day across the country. Express pickup is also available from any partner pharmacy." },
  { q: "Are your medicines authentic?", a: "Every product is sourced directly from licensed manufacturers and verified by our team of registered pharmacists. We guarantee 100% authenticity." },
  { q: "Can I order prescription medicines?", a: "Yes. Upload a clear photo of your valid prescription during checkout, and our pharmacists will verify it before dispatch." },
  { q: "What payment methods are accepted?", a: "We accept all major credit/debit cards, digital wallets, cash on delivery, and installment plans through select banks." },
  { q: "How can I return a product?", a: "Most items can be returned within 7 days. Sealed medicines are returnable only if damaged or expired; contact our 24/7 support to initiate." },
];
export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: "Hi! I'm your AI pharmacist. Ask me about medicines, dosage, side effects or general health. How can I help today?" },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const ask = useServerFn(askPharmacist);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, chatOpen]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || sending) return;
    const next: ChatMsg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      const { reply } = await ask({ data: { messages: next } });
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, I'm having trouble right now. Please try again." }]);
    } finally {
      setSending(false);
    }
  };

  const suggestions = ["Panadol dosage for adults?", "Cold and flu remedies", "Is Brufen safe with food?"];

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="grid md:grid-cols-2 gap-10">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Help center</span>
          <h2 className="text-3xl md:text-4xl font-extrabold mt-1">Frequently asked questions</h2>
          <p className="text-muted-foreground mt-3">Can't find what you're looking for? Our team of pharmacists is available 24/7 to help.</p>
          <div className="mt-5 relative rounded-3xl overflow-hidden shadow-card group">
            <img
              src={pharmacistImg}
              alt="Pharmacist available 24/7"
              loading="lazy"
              width={1024}
              height={1024}
              className="w-full h-64 md:h-72 object-cover transition-smooth group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-success text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />Online now
                </div>
                <p className="font-bold text-lg mt-1">Ask our AI pharmacist</p>
              </div>
              <button
                onClick={() => setChatOpen(true)}
                className="px-5 py-3 rounded-full bg-gradient-cta text-primary-foreground font-semibold shadow-soft hover:scale-105 transition-smooth whitespace-nowrap"
              >
                <i className="fa-solid fa-comments mr-2" />Chat with Pharmacist
              </button>
            </div>
          </div>
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

      {chatOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={() => setChatOpen(false)} />
          <div className="relative w-full md:max-w-lg bg-card rounded-t-3xl md:rounded-3xl shadow-elegant flex flex-col h-[85vh] md:h-[600px] animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <img src={pharmacistImg} alt="" className="w-10 h-10 rounded-full object-cover" />
              <div className="flex-1">
                <div className="font-bold leading-tight">AI Pharmacist</div>
                <div className="text-xs text-success flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />Online · replies instantly
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="w-9 h-9 rounded-full hover:bg-muted grid place-items-center" aria-label="Close">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-200`}>
                  <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
                    m.role === "user"
                      ? "bg-gradient-cta text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </div>

            {messages.length <= 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => send(s)} disabled={sending}
                    className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-accent transition-smooth">
                    {s}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => { e.preventDefault(); send(); }}
              className="p-3 border-t border-border flex gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about a medicine, dosage…"
                disabled={sending}
                className="flex-1 px-4 py-2.5 rounded-full bg-muted text-sm outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="w-11 h-11 rounded-full bg-gradient-cta text-primary-foreground grid place-items-center disabled:opacity-50 hover:scale-105 transition-smooth"
                aria-label="Send"
              >
                <i className={`fa-solid ${sending ? "fa-spinner fa-spin" : "fa-paper-plane"}`} />
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

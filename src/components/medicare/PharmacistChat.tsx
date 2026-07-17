import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import pharmacistImg from "@/assets/pharmacist.jpg";
import { askPharmacist } from "@/lib/pharmacist.functions";

type ChatMsg = { role: "user" | "assistant"; content: string };

export default function PharmacistChat() {
  const ask = useServerFn(askPharmacist);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: "Hi! I'm your AI pharmacist. Ask me about medicines, dosage, side effects, interactions, or general wellness." },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

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
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, I'm having trouble right now. Please try again." }]);
    } finally {
      setSending(false);
    }
  };

  const suggestions = ["Panadol dosage for adults?", "Can I take Brufen with food?", "Cold and flu remedies"];

  return (
    <section id="pharmacist-chat" className="py-20 bg-gradient-to-br from-emerald-50 via-white to-sky-50">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto items-stretch">
          <div className="rounded-3xl overflow-hidden bg-white shadow-lg border border-white/70">
            <img src={pharmacistImg} alt="AI pharmacist chat" className="w-full h-72 lg:h-full object-cover" loading="lazy" />
          </div>
          <div className="rounded-3xl bg-card shadow-elegant border border-border flex flex-col h-[680px] overflow-hidden">
            <div className="flex items-center gap-3 p-5 border-b border-border">
              <img src={pharmacistImg} alt="" className="w-11 h-11 rounded-full object-cover" />
              <div className="flex-1">
                <div className="font-bold leading-tight">AI Pharmacist Chat</div>
                <div className="text-xs text-success flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />Online · replies instantly
                </div>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
                    m.role === "user" ? "bg-gradient-cta text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </div>

            {messages.length <= 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => send(s)} disabled={sending} className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-accent transition-smooth">
                    {s}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); send(); }} className="p-3 border-t border-border flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about a medicine, dosage…"
                disabled={sending}
                className="flex-1 px-4 py-2.5 rounded-full bg-muted text-sm outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
              />
              <button type="submit" disabled={sending || !input.trim()} className="w-11 h-11 rounded-full bg-gradient-cta text-primary-foreground grid place-items-center disabled:opacity-50 hover:scale-105 transition-smooth" aria-label="Send">
                <i className={`fa-solid ${sending ? "fa-spinner fa-spin" : "fa-paper-plane"}`} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AiLoginModal from "./AiLoginModal";

const TOOLS = [
  { icon: "fa-prescription", title: "Prescription Scanner", desc: "Snap a prescription and get instant AI insights." },
  { icon: "fa-file-waveform", title: "Medical Report AI", desc: "Understand lab reports in plain language." },
  { icon: "fa-face-smile", title: "Skin Analysis", desc: "AI-powered skin condition assessment." },
  { icon: "fa-microphone-lines", title: "Voice Assistant", desc: "Talk to our AI pharmacist in English or Urdu." },
  { icon: "fa-heart-pulse", title: "Health Dashboard", desc: "Personalised health insights and tracking." },
  { icon: "fa-comments", title: "Pharmacist Chat", desc: "24/7 chat with our AI pharmacist." },
];

export default function AiFeaturesTeaser() {
  const [modalOpen, setModalOpen] = useState(false);
  const { data: session } = useQuery({
    queryKey: ["auth-session"],
    queryFn: async () => (await supabase.auth.getSession()).data.session,
  });

  return (
    <>
      <AiLoginModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <section id="ai-features" className="container mx-auto px-4 py-14 md:py-20">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-block text-xs uppercase tracking-widest text-primary font-bold mb-2">AI Features</div>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Smarter healthcare, powered by AI</h2>
          <p className="text-muted-foreground">Six AI tools built for you. Sign in to try — every account gets 1 free use.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS.map((t) => (
            <div key={t.title} className="rounded-2xl border border-border bg-card p-6 shadow-soft hover:shadow-elegant transition-smooth">
              <div className="w-12 h-12 rounded-xl bg-gradient-cta grid place-items-center shadow-glow mb-4">
                <i className={`fa-solid ${t.icon} text-primary-foreground text-lg`} />
              </div>
              <h3 className="font-bold text-lg mb-1">{t.title}</h3>
              <p className="text-sm text-muted-foreground">{t.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex justify-center">
          {session ? (
            <Link to="/ai-features" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-cta text-primary-foreground font-bold shadow-glow">
              <i className="fa-solid fa-wand-magic-sparkles" /> Open AI Features
            </Link>
          ) : (
            <button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-cta text-primary-foreground font-bold shadow-glow">
              <i className="fa-solid fa-lock" /> Unlock AI Features
            </button>
          )}
        </div>
      </section>
    </>
  );
}
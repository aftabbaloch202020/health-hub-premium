import { Link } from "@tanstack/react-router";

const TOOLS = [
  { icon: "fa-prescription", title: "Prescription Scanner", desc: "Snap a prescription and get instant AI insights on medicines, dosage and alternatives.", hash: "prescription" },
  { icon: "fa-file-waveform", title: "Medical Report AI", desc: "Upload lab reports, X-rays or MRI scans and get plain-language explanations.", hash: "report" },
  { icon: "fa-face-smile", title: "Skin Analysis", desc: "AI-powered skin condition assessment with recommended treatments.", hash: "skin" },
  { icon: "fa-microphone-lines", title: "Voice Assistant", desc: "Talk to our AI pharmacist in English or Urdu, hands-free.", hash: "voice" },
  { icon: "fa-heart-pulse", title: "Health Dashboard", desc: "Track BP, sugar, heart rate and O2 with AI-generated trend insights.", hash: "health" },
  { icon: "fa-bell", title: "Medicine Reminder", desc: "Never miss a dose — smart reminders crafted just for you.", hash: "reminder" },
  { icon: "fa-comments", title: "Pharmacist Chat", desc: "24/7 chat with our AI pharmacist for quick, reliable answers.", hash: "chat" },
];

export default function AiFeaturesShowcase() {
  return (
    <section id="ai-features" className="container mx-auto px-4 py-14 md:py-20">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-block text-xs uppercase tracking-widest text-primary font-bold mb-2">AI Features</div>
        <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Smarter healthcare, powered by AI</h2>
        <p className="text-muted-foreground">Seven AI tools built for you — tap any card to get started.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TOOLS.map((t) => (
          <Link
            key={t.title}
            to="/ai-features"
            hash={t.hash}
            className="group rounded-2xl border border-border bg-card p-6 shadow-soft hover:shadow-elegant hover:-translate-y-1 transition-smooth"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-cta grid place-items-center shadow-glow mb-4 group-hover:scale-110 transition-smooth">
              <i className={`fa-solid ${t.icon} text-primary-foreground text-lg`} />
            </div>
            <h3 className="font-bold text-lg mb-1">{t.title}</h3>
            <p className="text-sm text-muted-foreground">{t.desc}</p>
            <div className="mt-4 inline-flex items-center gap-2 text-primary font-semibold text-sm">
              Open tool <i className="fa-solid fa-arrow-right group-hover:translate-x-1 transition-smooth" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
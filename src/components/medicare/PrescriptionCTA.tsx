export default function PrescriptionCTA() {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="grid md:grid-cols-2 gap-5">
        <div className="rounded-3xl p-8 md:p-10 bg-card shadow-card hover-lift relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-cta opacity-10 rounded-full -translate-y-10 translate-x-10" />
          <div className="w-14 h-14 rounded-2xl bg-gradient-cta text-primary-foreground grid place-items-center mb-4">
            <i className="fa-solid fa-prescription text-xl" />
          </div>
          <h3 className="text-2xl font-extrabold">Upload your prescription</h3>
          <p className="text-muted-foreground mt-2 max-w-sm">Drag & drop your doctor's prescription. Our pharmacists will prepare your order within minutes.</p>
          <button className="mt-5 px-6 py-3 rounded-full bg-gradient-cta text-primary-foreground font-semibold">
            <i className="fa-solid fa-cloud-arrow-up mr-2" />Upload Now
          </button>
        </div>
        <div className="rounded-3xl p-8 md:p-10 glass shadow-card hover-lift relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-secondary opacity-20 rounded-full translate-y-12 -translate-x-12" />
          <div className="w-14 h-14 rounded-2xl bg-secondary text-secondary-foreground grid place-items-center mb-4">
            <i className="fa-solid fa-robot text-xl" />
          </div>
          <h3 className="text-2xl font-extrabold">AI Medicine Finder</h3>
          <p className="text-muted-foreground mt-2 max-w-sm">Describe your symptoms and our AI will recommend over-the-counter remedies & wellness products.</p>
          <button className="mt-5 px-6 py-3 rounded-full bg-secondary text-secondary-foreground font-semibold">
            <i className="fa-solid fa-wand-magic-sparkles mr-2" />Try AI Assistant
          </button>
        </div>
      </div>
    </section>
  );
}

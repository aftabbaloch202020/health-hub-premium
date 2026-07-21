import { createFileRoute } from "@tanstack/react-router";
import Header from "@/components/medicare/Header";
import Footer from "@/components/medicare/Footer";
import CartDrawer from "@/components/medicare/CartDrawer";
import PrescriptionCTA from "@/components/medicare/PrescriptionCTA";
import MedicalReportAI from "@/components/medicare/MedicalReportAI";
import SkinAnalysis from "@/components/medicare/SkinAnalysis";
import VoiceCallAssistant from "@/components/medicare/VoiceCallAssistant";
import HealthDashboard from "@/components/medicare/HealthDashboard";
import MedicineReminder from "@/components/medicare/MedicineReminder";
import PharmacistChat from "@/components/medicare/PharmacistChat";
import { useState } from "react";

export const Route = createFileRoute("/ai-features")({
  head: () => ({ meta: [
    { title: "AI Features — Darman STORE" },
    { name: "description", content: "Access all AI-powered health tools: prescription scanner, report analysis, skin AI, voice pharmacist and more." },
  ] }),
  component: AiFeaturesPage,
});

function AiFeaturesPage() {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Header onCartOpen={() => setCartOpen(true)} />
      <main className="flex-1">
        <section className="container mx-auto px-4 pt-10 pb-6">
          <div className="rounded-3xl bg-gradient-cta text-primary-foreground p-6 md:p-10 shadow-glow flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
            <div className="flex-1">
              <div className="text-xs uppercase tracking-widest opacity-90 font-bold mb-1">AI Features</div>
              <h1 className="text-2xl md:text-4xl font-extrabold">All your AI health tools in one place</h1>
              <p className="text-sm md:text-base opacity-90 mt-2">Explore every AI health tool — free and open to everyone.</p>
            </div>
          </div>
        </section>
        <PrescriptionCTA />
        <MedicalReportAI />
        <SkinAnalysis />
        <VoiceCallAssistant />
        <HealthDashboard />
        <MedicineReminder />
        <PharmacistChat />
      </main>
      <Footer />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}

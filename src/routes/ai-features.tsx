import { createFileRoute, Link } from "@tanstack/react-router";
import Header from "@/components/medicare/Header";
import Footer from "@/components/medicare/Footer";
import CartDrawer from "@/components/medicare/CartDrawer";
import AiGate from "@/components/medicare/AiGate";
import PrescriptionCTA from "@/components/medicare/PrescriptionCTA";
import MedicalReportAI from "@/components/medicare/MedicalReportAI";
import SkinAnalysis from "@/components/medicare/SkinAnalysis";
import VoiceCallAssistant from "@/components/medicare/VoiceCallAssistant";
import HealthDashboard from "@/components/medicare/HealthDashboard";
import MedicineReminder from "@/components/medicare/MedicineReminder";
import PharmacistChat from "@/components/medicare/PharmacistChat";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAccessInfo } from "@/lib/access.functions";

export const Route = createFileRoute("/ai-features")({
  head: () => ({ meta: [
    { title: "AI Features — Darman STORE" },
    { name: "description", content: "Access all AI-powered health tools: prescription scanner, report analysis, skin AI, voice pharmacist and more." },
  ] }),
  component: AiFeaturesPage,
});

function AiFeaturesPage() {
  const [cartOpen, setCartOpen] = useState(false);
  const accessFn = useServerFn(getAccessInfo);
  const { data: access } = useQuery({ queryKey: ["ai-access"], queryFn: () => accessFn() });

  return (
    <div className="min-h-screen flex flex-col">
      <Header onCartOpen={() => setCartOpen(true)} />
      <main className="flex-1">
        <section className="container mx-auto px-4 pt-10 pb-6">
          <div className="rounded-3xl bg-gradient-cta text-primary-foreground p-6 md:p-10 shadow-glow flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
            <div className="flex-1">
              <div className="text-xs uppercase tracking-widest opacity-90 font-bold mb-1">AI Features</div>
              <h1 className="text-2xl md:text-4xl font-extrabold">All your AI health tools in one place</h1>
              <p className="text-sm md:text-base opacity-90 mt-2">
                {access?.hasActiveSub
                  ? `Active ${access.subPlan} plan — enjoy unlimited AI use.`
                  : access?.freeTrialUsed
                    ? "Your free trial has ended — subscribe to keep unlimited access."
                    : "You have 1 free AI usage. Try any tool below."}
              </p>
            </div>
            {!access?.hasActiveSub && (
              <Link to="/subscribe" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-background text-foreground font-semibold shadow-soft">
                <i className="fa-solid fa-crown text-primary" /> View plans
              </Link>
            )}
          </div>
        </section>
        <AiGate tool="prescription"><PrescriptionCTA /></AiGate>
        <AiGate tool="report"><MedicalReportAI /></AiGate>
        <AiGate tool="skin"><SkinAnalysis /></AiGate>
        <AiGate tool="voice"><VoiceCallAssistant /></AiGate>
        <AiGate tool="health"><HealthDashboard /></AiGate>
        <AiGate tool="reminder"><MedicineReminder /></AiGate>
        <AiGate tool="chat"><PharmacistChat /></AiGate>
      </main>
      <Footer />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
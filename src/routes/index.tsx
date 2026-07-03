import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import Header from "@/components/medicare/Header";
import Hero from "@/components/medicare/Hero";
import FeatureBar from "@/components/medicare/FeatureBar";
import Categories from "@/components/medicare/Categories";
import LiveMedicineGrid from "@/components/medicare/LiveMedicineGrid";
import Deals from "@/components/medicare/Deals";
import PrescriptionCTA from "@/components/medicare/PrescriptionCTA";
import MedicalReportAI from "@/components/medicare/MedicalReportAI";
import VoiceCallAssistant from "@/components/medicare/VoiceCallAssistant";
import HealthDashboard from "@/components/medicare/HealthDashboard";
import SkinAnalysis from "@/components/medicare/SkinAnalysis";
import MedicineReminder from "@/components/medicare/MedicineReminder";
import Testimonials from "@/components/medicare/Testimonials";
import FAQ from "@/components/medicare/FAQ";
import Newsletter from "@/components/medicare/Newsletter";
import Contact from "@/components/medicare/Contact";
import Footer from "@/components/medicare/Footer";
import CartDrawer from "@/components/medicare/CartDrawer";
import AiGate from "@/components/medicare/AiGate";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Darman STORE — Online Pharmacy & Wellness Store" },
      { name: "description", content: "Order genuine medicines, vitamins and health essentials online. Free 30-minute delivery, 24/7 pharmacist support and verified products." },
      { property: "og:title", content: "Darman STORE — Online Pharmacy & Wellness Store" },
      { property: "og:description", content: "Genuine medicines, vitamins and wellness — delivered in 30 minutes." },
    ],
  }),
  component: Index,
});

function Index() {
  const [cartOpen, setCartOpen] = useState(false);
  return (
    <div className="min-h-screen flex flex-col">
      <Header onCartOpen={() => setCartOpen(true)} />
      <main className="flex-1">
        <Hero />
        <FeatureBar />
        <Categories />
        <Deals />
        <LiveMedicineGrid />
        <div id="ai-features">
          <AiGate tool="prescription"><PrescriptionCTA /></AiGate>
          <AiGate tool="report"><MedicalReportAI /></AiGate>
          <AiGate tool="skin"><SkinAnalysis /></AiGate>
          <AiGate tool="voice"><VoiceCallAssistant /></AiGate>
          <AiGate tool="health"><HealthDashboard /></AiGate>
          <MedicineReminder />
        </div>
        <Testimonials />
        <FAQ />
        <Contact />
        <Newsletter />
      </main>
      <Footer />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}

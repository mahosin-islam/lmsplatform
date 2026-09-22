import { HeroSlider } from "@/components/landing/HeroSlider";
import { StatsSection } from "@/components/landing/StatsSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";
import { AIChatWidget } from "@/components/chat/AIChatWidget";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <HeroSlider />
      <StatsSection />
      <FeaturesSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
      <AIChatWidget />
    </div>
  );
}
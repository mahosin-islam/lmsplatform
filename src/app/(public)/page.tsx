import { HeroSlider } from "@/components/landing/HeroSlider";
import { StatsSection } from "@/components/landing/StatsSection";
import { FeaturedCoursesSection } from "@/components/landing/FeaturedCoursesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { InstructorsSection } from "@/components/landing/InstructorsSection";
import { CertificateSection } from "@/components/landing/CertificateSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";
import { AIChatWidget } from "@/components/chat/AIChatWidget";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <HeroSlider />
      <StatsSection />
      <FeaturedCoursesSection />
      <HowItWorksSection />
      <FeaturesSection />
      <InstructorsSection />
      <CertificateSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <Footer />
      <AIChatWidget />
    </div>
  );
}

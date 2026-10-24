import { HomeHero } from "@/components/landing/HomeHero";
import { FeaturedCoursesSection } from "@/components/landing/FeaturedCoursesSection";

import { FeaturesSection } from "@/components/landing/FeaturesSection";
import InstructorsSection from "@/components/landing/InstructorsSection";
import { CertificateSection } from "@/components/landing/CertificateSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTASection } from "@/components/landing/CTASection";
import { AIChatWidget } from "@/components/chat/AIChatWidget";
import { StatsSection } from "@/components/landing/StatsSection";
import StudentJourneySection from "@/components/landing/StudentJourneySection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <StatsSection/>
      <FeaturedCoursesSection />
      <HowItWorksSection />
      <FeaturesSection />
      <InstructorsSection />
      <StudentJourneySection/>
      <CertificateSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <AIChatWidget />
    </>
  );
}

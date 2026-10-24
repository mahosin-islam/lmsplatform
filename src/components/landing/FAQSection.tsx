import { Sparkles, PhoneCall, ChevronDown } from "lucide-react";
import Link from "next/link";

const FAQS = [
  {
    question: "What courses can I take here?",
    answer:
      "We focus on English skills — spoken fluency, grammar, writing and more. You can pick a self-paced course or join a scheduled batch with live support sessions.",
  },
  {
    question: "How do I enroll and pay securely?",
    answer:
      "Create a free account, choose a course and pay securely using local MFS like bKash or Nagad. Free courses unlock instantly, and paid orders are verified quickly.",
  },
  {
    question: "Are the lessons live or recorded?",
    answer:
      "Both. Every course includes HD recorded lessons you can watch anytime, while live batches include interactive support sessions with your mentor.",
  },
  {
    question: "Do I get a verified certificate?",
    answer:
      "Yes! Complete 100% of a course and your certificate unlocks automatically. You can download it as a PDF or verify it instantly online.",
  },
  {
    question: "Can I get career and job placement support?",
    answer:
      "Absolutely. Our career placement team guides you through resume building, portfolio creation, and connects you with partner companies.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="section-y scroll-mt-20 bg-background">
      <div className="page-container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Side: Heading, Description & Call to Action */}
          <div className="space-y-5 lg:sticky lg:top-28 lg:col-span-5">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary bg-primary/5 px-3 py-1 rounded-md border border-primary/10">
                <Sparkles className="size-3.5 text-primary" />
                FAQ
              </span>
              <h2 className="text-2xl leading-tight font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                Have <span className="text-primary">Questions?</span>
              </h2>
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              If you have questions that you feel haven&apos;t been answered on our website or in our free introductory overview, book an online meeting with our advisory team. We are here to guide you from day one.
            </p>

            {/* CTA Button styled like the screenshot */}
            <div className="pt-2">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center font-medium transition-all duration-300 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3.5 rounded-xl shadow-sm hover:shadow-md gap-2"
              >
                <PhoneCall className="size-4" />
                Book a call
              </Link>
            </div>

            <p className="text-xs text-muted-foreground pt-4">
              Need instant answers? Ask <span className="font-semibold text-primary">Mentora</span>, our AI study assistant floating right on your screen.
            </p>
          </div>

          {/* Right Side: FAQ Accordion Cards */}
          <div className="lg:col-span-7 space-y-4">
            {FAQS.map(({ question, answer }) => (
              <details
                key={question}
                className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 open:border-primary/40 open:shadow-md sm:p-6"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-semibold tracking-tight text-card-foreground outline-none [&::-webkit-details-marker]:hidden">
                  {question}
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-foreground transition-transform duration-300 group-open:rotate-180 group-open:bg-primary/10 group-open:text-primary">
                    <ChevronDown className="size-4" />
                  </span>
                </summary>
                <p className="mt-4 border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground">
                  {answer}
                </p>
              </details>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
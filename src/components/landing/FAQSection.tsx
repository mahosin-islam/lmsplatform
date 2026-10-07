import { Plus, Sparkles } from "lucide-react";

const FAQS = [
  {
    question: "What courses can I take here?",
    answer:
      "We focus on English skills — spoken fluency, grammar, writing and more. You can pick a self-paced (fixed) course or join a scheduled batch with live support sessions.",
  },
  {
    question: "How do I enroll and pay?",
    answer:
      "Create a free account, choose a course and pay securely with bKash or NAGAD. Free courses unlock instantly after enrollment, and paid orders are verified by our team before access is granted.",
  },
  {
    question: "Are the lessons live or recorded?",
    answer:
      "Both. Every course includes HD recorded lessons you can watch anytime on any device, while batch courses add live support sessions with your instructor.",
  },
  {
    question: "Do I get a certificate?",
    answer:
      "Yes. Complete 100% of a course and your certificate unlocks automatically — download it as a PDF and share its verification code with anyone.",
  },
  {
    question: "Can I verify someone else's certificate?",
    answer:
      "Absolutely. Every certificate has a unique code that can be checked on our public Verify page — no login or account required.",
  },
  {
    question: "Do I need a laptop to study?",
    answer:
      "No. The platform runs in any browser on mobile, tablet or desktop, and your progress is tracked to your account so you can continue wherever you are.",
  },
];

export function FAQSection() {
  return (
    <section className="bg-slate-50 py-16 ">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
            ❓ Frequently Asked Questions
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">
            Everything you wanted to ask
          </h2>
        </div>

        <div className="mt-10 space-y-4">
          {FAQS.map(({ question, answer }) => (
            <details
              key={question}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow open:shadow-md sm:p-6"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-sm font-semibold text-slate-900 outline-none sm:text-base [&::-webkit-details-marker]:hidden">
                {question}
                <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 transition-transform duration-200 group-open:rotate-45">
                  <Plus className="size-4" />
                </span>
              </summary>
              <p className="mt-3 border-t border-slate-100 pt-3 text-sm leading-relaxed text-slate-600">
                {answer}
              </p>
            </details>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Still have a question? Ask{" "}
          <span className="inline-flex items-center gap-1 font-semibold text-indigo-600">
            <Sparkles className="size-3.5" />
            Mentora
          </span>
          , our AI study assistant — it pops up right on this page.
        </p>
      </div>
    </section>
  );
}

import { Award, CreditCard, MonitorPlay, Search } from "lucide-react";
import { cn } from "cn";

const STEPS = [
  {
    number: "01",
    icon: Search,
    title: "Find your course",
    description:
      "Browse the catalog, filter by level and course type, and compare the full syllabus before you decide.",
    tint: "bg-indigo-50 text-indigo-600",
  },
  {
    number: "02",
    icon: CreditCard,
    title: "Enroll in seconds",
    description:
      "Pay securely with bKash or NAGAD — or jump straight into free courses the moment you sign up.",
    tint: "bg-purple-50 text-purple-600",
  },
  {
    number: "03",
    icon: MonitorPlay,
    title: "Learn your way",
    description:
      "Watch HD lessons anytime, join live support sessions, and complete assignments and quizzes.",
    tint: "bg-blue-50 text-blue-600",
  },
  {
    number: "04",
    icon: Award,
    title: "Earn your certificate",
    description:
      "Finish 100% of the course and download a shareable certificate with a public verification code.",
    tint: "bg-amber-50 text-amber-600",
  },
];

export function HowItWorksSection() {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
            ⚡ How It Works
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">
            From signup to certificate in 4 steps
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">
            No complicated setup — create an account and start learning the
            same day.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ number, icon: Icon, title, description, tint }) => (
            <div
              key={number}
              className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-7 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              <span
                aria-hidden="true"
                className="absolute top-2 right-2 text-5xl font-black text-indigo-100 select-none"
              >
                {number}
              </span>
              <span
                className={cn(
                  "relative inline-flex size-13 items-center justify-center rounded-2xl",
                  tint
                )}
              >
                <Icon className="size-6" />
              </span>
              <p className="relative mt-4 text-xs font-bold tracking-widest text-indigo-500 uppercase">
                Step {number}
              </p>
              <h3 className="relative mt-1 text-lg font-bold text-slate-900">
                {title}
              </h3>
              <p className="relative mt-2 text-sm leading-relaxed text-slate-600">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

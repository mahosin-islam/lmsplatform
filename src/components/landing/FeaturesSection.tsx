import {
  BookOpen,
  ClipboardCheck,
  MessageSquare,
  TrendingUp,
} from "lucide-react";

import { Reveal } from "@/components/shared/Reveal";

const BENEFITS = [
  {
    icon: BookOpen,
    title: "Structured lessons",
    description:
      "Clear modules with HD video, worked examples and notes you can revisit anytime.",
  },
  {
    icon: ClipboardCheck,
    title: "Assignments & quizzes",
    description:
      "Practise after every module and check your understanding before moving on.",
  },
  {
    icon: MessageSquare,
    title: "Live support sessions",
    description:
      "Batch learners join scheduled sessions and ask their instructor questions directly.",
  },
  {
    icon: TrendingUp,
    title: "Visible progress",
    description:
      "Track completed lessons and see exactly how close you are to your certificate.",
  },
];

export function FeaturesSection() {
  return (
    <section className="section-y bg-background">
      <div className="page-container">
        <Reveal className="max-w-2xl">
          <h2 className="text-2xl leading-tight font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
            Built for steady, visible progress
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Everything around the lessons — practice, feedback and a clear view
            of how far you have come.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {BENEFITS.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
            >
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                  {title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

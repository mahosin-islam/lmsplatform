import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, Users, BookOpen, Award, Target } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about our mission to make quality English education accessible through expert-led courses, live batches, and practical learning.",
};

const values = [
  {
    icon: Target,
    title: "Our Mission",
    description:
      "To empower learners with practical English skills that open doors to better education, careers, and opportunities.",
  },
  {
    icon: BookOpen,
    title: "Practical Learning",
    description:
      "Every course focuses on real-world application with interactive exercises, assignments, and live practice.",
  },
  {
    icon: Users,
    title: "Expert Support",
    description:
      "Learn from experienced teachers who provide personalized feedback and guidance throughout your journey.",
  },
  {
    icon: Award,
    title: "Recognition",
    description:
      "Earn verifiable certificates that showcase your skills and help you stand out in your career.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="section-y">
        <div className="page-container">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-teal">
              About Us
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              Empowering Learners Through Quality Education
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              We are committed to making English education accessible, practical,
              and effective. Our platform combines self-paced courses with live
              batches to help you build real skills that matter.
            </p>
          </div>
        </div>
      </section>

      <section className="section-y bg-muted/30">
        <div className="page-container">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Our Story
            </h2>
            <div className="mt-4 space-y-4 text-muted-foreground">
              <p>
                Founded with the goal of bridging the gap between classroom
                learning and real-world communication, we provide a complete
                learning ecosystem where students can learn at their own pace
                or engage in live interactive sessions.
              </p>
              <p>
                Our approach blends structured curriculum, experienced
                instructors, hands-on assignments, and continuous support to
                ensure every learner achieves their goals.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-y">
        <div className="page-container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              What Drives Us
            </h2>
            <p className="mt-2 text-muted-foreground">
              The principles that guide everything we do
            </p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <div
                key={value.title}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <value.icon className="size-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-card-foreground">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-y">
        <div className="page-container">
          <div className="rounded-3xl border border-border bg-card px-6 py-10 text-center shadow-sm sm:px-10">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <GraduationCap className="size-7" />
            </div>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-card-foreground sm:text-3xl">
              Ready to Start Your Learning Journey?
            </h2>
            <p className="mt-2 text-muted-foreground">
              Join thousands of learners building skills for a better future.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/courses"
                className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Browse Courses
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

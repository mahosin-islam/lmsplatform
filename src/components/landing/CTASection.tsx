import Link from "next/link";
import { ArrowRight, Rocket } from "lucide-react";

export function CTASection() {
  return (
    <section className="section-y bg-background">
      <div className="page-container">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card px-6 py-10 text-center md:py-12">
          <span className="relative inline-flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Rocket className="size-6" />
          </span>

          <h2 className="relative mt-4 text-2xl leading-tight font-bold tracking-tight text-foreground sm:text-3xl">
            Ready to start your English journey?
          </h2>
          <p className="relative mx-auto mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Join our learners and master English with expert-led courses and live batches.
          </p>

          <div className="relative mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/courses"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Browse Courses
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/register"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-border px-6 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

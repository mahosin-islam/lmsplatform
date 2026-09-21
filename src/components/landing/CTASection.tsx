import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="px-4 py-16 sm:px-6 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-purple-700 px-6 py-16 text-center md:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-20 -top-20 size-64 rounded-full bg-white/10 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -right-16 size-72 rounded-full bg-white/10 blur-2xl"
          />

          <h2 className="relative text-3xl font-bold text-white md:text-4xl">
            🚀 Ready to Start Your English Journey?
          </h2>
          <p className="relative mx-auto mt-4 max-w-2xl text-lg text-white/85 md:text-xl">
            Join thousands of learners and master English with our expert-led
            courses.
          </p>

          <div className="relative mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-slate-900 shadow-lg transition-all hover:bg-slate-100"
            >
              Browse Courses
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/60 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:border-white hover:bg-white/10"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
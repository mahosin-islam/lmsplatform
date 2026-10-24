"use client";
import Image from "next/image";
import heroImg from "../../../public/undraw_online-learning_tgmv.svg";
import Link from "next/link";
import { ArrowRight, Play, Sparkles } from "lucide-react";

export function HomeHero() {
  return (
    <section className="relative overflow-hidden bg-background">
      {/* Soft background blobs */}
      <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />

      {/* ↓↓↓ Height কমানোর মূল পরিবর্তন — py কমিয়েছি ↓↓↓ */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-10">

          {/* ─── LEFT: Content ─── */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary shadow-sm sm:text-sm">
              <Sparkles className="size-3.5" />
              Bangladesh&apos;s #1 English Learning Platform
            </span>

            {/* Title */}
            <h1 className="mt-4 text-4xl leading-tight font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Spoken English
              <br />
              With{" "}
              <span className="text-primary">
                Confidence
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0">
              Learn English from expert teachers with live interactive
              classes, self-paced courses, and real-world practice. From
              grammar to spoken fluency — we&apos;ve got you covered.
            </p>

            {/* Buttons */}
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href="/courses"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 sm:w-auto sm:text-base"
              >
                Browse Courses
                <ArrowRight className="size-4" />
              </Link>

              <Link
                href="/courses"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-6 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-muted sm:w-auto sm:text-base"
              >
                <Play className="size-4" />
                Start Free
              </Link>
            </div>

            {/* Small trust signals */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground sm:text-sm lg:justify-start">
              <div className="flex items-center gap-1.5">
                <span className="text-base">✅</span>
                Lifetime access
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-base">🎓</span>
                Certificate included
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-base">💬</span>
                Live support
              </div>
            </div>
          </div>

          {/* ─── RIGHT: Illustration ─── */}
          <div className="relative flex justify-center lg:justify-end">
            {/* ↓↓↓ max-w কমিয়েছি যাতে image ছোট হয় ↓↓↓ */}
            <div className="relative w-full max-w-xs sm:max-w-sm lg:max-w-md">
              <Image
                src={heroImg}
                alt="Online English learning illustration"
                width={600}
                height={400}
                priority
                className="h-auto w-full"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
"use client";
import Image from "next/image";
import heroImg from "../../../public/undraw_online-learning_tgmv.svg";
import Link from "next/link";
import { ArrowRight, Play, Sparkles } from "lucide-react";

export function HeroSlider() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Soft background blobs */}
      <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-purple-200/40 blur-3xl" />

      {/* ↓↓↓ Height কমানোর মূল পরিবর্তন — py কমিয়েছি ↓↓↓ */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-10">

          {/* ─── LEFT: Content ─── */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 py-1.5 text-xs font-medium text-indigo-700 shadow-sm sm:text-sm">
              <Sparkles className="size-3.5" />
              Bangladesh&apos;s #1 English Learning Platform
            </span>

            {/* Title */}
            <h1 className="mt-4 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl">
              Spoken English
              <br />
              With{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Confidence
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base md:text-lg lg:mx-0">
              Learn English from expert teachers with live interactive
              classes, self-paced courses, and real-world practice. From
              grammar to spoken fluency — we&apos;ve got you covered.
            </p>

            {/* Buttons */}
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href="/courses"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 hover:shadow-xl sm:w-auto sm:text-base"
              >
                Browse Courses
                <ArrowRight className="size-4" />
              </Link>

              <Link
                href="/courses"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:border-slate-400 hover:bg-slate-50 sm:w-auto sm:text-base"
              >
                <Play className="size-4" />
                Start Free
              </Link>
            </div>

            {/* Small trust signals */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500 sm:text-sm lg:justify-start">
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
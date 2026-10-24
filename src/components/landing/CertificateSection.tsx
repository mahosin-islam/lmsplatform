import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Download,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { fetchPublic } from "@/lib/api-server";
import type { CourseListData } from "@/types";

const BENEFITS = [
  {
    icon: BadgeCheck,
    title: "Unlocks automatically",
    description:
      "Reach 100% course progress and your certificate is issued instantly.",
  },
  {
    icon: ShieldCheck,
    title: "Publicly verifiable",
    description:
      "Every certificate carries a unique code anyone can check on the Verify page — no login needed.",
  },
  {
    icon: Download,
    title: "Download & share",
    description:
      "Save it as a PDF and add it to your CV, LinkedIn profile or portfolio.",
  },
];

async function loadPreview() {
  try {
    const data = await fetchPublic<CourseListData>("/courses?status=PUBLISHED");
    const course = data.courses?.[0];
    return {
      courseTitle: course?.title ?? "Course completion",
      instructor: course?.admin?.name ?? null,
    };
  } catch {
    return { courseTitle: "Course completion", instructor: null };
  }
}

export async function CertificateSection() {
  const preview = await loadPreview();

  return (
    <section className="section-y bg-background">
      <div className="page-container">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-teal/25 bg-brand-teal/10 px-3 py-1 text-xs font-semibold text-brand-teal-strong">
              <Sparkles className="size-3.5" />
              Verified certificates
            </span>
            <h2 className="mt-4 text-2xl leading-tight font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
              Your achievement,{" "}
              <span className="text-primary">officially proven</span>
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Finish a course and you do not just get a PDF — you get a
              tamper-proof credential with a verification code that employers
              and peers can confirm in seconds.
            </p>

            <ul className="mt-6 space-y-4">
              {BENEFITS.map(({ icon: Icon, title, description }) => (
                <li key={title} className="flex gap-4">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">{title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <Link
              href="/courses"
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Start earning certificates
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="mx-auto w-full max-w-md">
            <div className="rounded-2xl border border-border bg-card p-2 shadow-sm">
              <div className="rounded-xl border border-dashed border-border bg-background px-5 py-7 text-center sm:px-7 sm:py-8">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold tracking-widest text-primary uppercase">
                  <Sparkles className="size-3" />
                  LMS Platform
                </span>

                <h3 className="mt-4 text-lg font-bold tracking-tight text-foreground sm:text-xl">
                  Certificate of Completion
                </h3>
                <p className="mt-3 text-[11px] text-muted-foreground">
                  This certificate is proudly presented to
                </p>
                <p className="mt-2 border-b border-dashed border-border pb-1 text-base font-bold text-foreground">
                  Your Name Here
                </p>
                <p className="mt-3 text-[11px] text-muted-foreground">
                  for successfully completing
                </p>
                <p className="mt-1 line-clamp-1 text-sm font-semibold text-primary">
                  {preview.courseTitle}
                </p>

                <div className="mt-6 flex items-end justify-between gap-4">
                  <div className="flex-1 text-left">
                    <p className="truncate text-xs font-bold text-foreground">
                      {preview.instructor ?? "Course instructor"}
                    </p>
                    <p className="mt-1 border-t border-border pt-1 text-[9px] tracking-wider text-muted-foreground uppercase">
                      Instructor
                    </p>
                  </div>

                  <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                    <BadgeCheck className="size-5" />
                    <span className="text-[7px] font-bold tracking-widest">
                      VERIFIED
                    </span>
                  </span>

                  <div className="flex-1 text-right">
                    <p className="text-xs font-bold text-foreground">
                      LMS Platform
                    </p>
                    <p className="mt-1 border-t border-border pt-1 text-[9px] tracking-wider text-muted-foreground uppercase">
                      Issued by
                    </p>
                  </div>
                </div>

                <p className="mt-5 text-[9px] tracking-wider text-muted-foreground uppercase">
                  Verify online at /verify
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CalendarRange,
  Users,
} from "lucide-react";

import { fetchPublic } from "@/lib/api-server";
import type { BatchSummary, Course, CourseListData } from "@/types";
import { formatDate, formatPrice, pickBatch } from "@/lib/course-utils";
import { CourseThumbnail } from "@/components/course/CourseThumbnail";
import { Reveal } from "@/components/shared/Reveal";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function statusChip(status: BatchSummary["status"]) {
  if (status === "ACTIVE") {
    return {
      label: "Live now",
      className: "bg-success/10 text-success",
      pulse: true,
    };
  }
  if (status === "UPCOMING") {
    return {
      label: "Upcoming",
      className: "bg-primary/10 text-primary",
      pulse: false,
    };
  }
  return {
    label: "Coming soon",
    className: "bg-muted text-muted-foreground",
    pulse: false,
  };
}

export async function LiveBatchesSection() {
  let courses: Course[] = [];

  try {
    const data = await fetchPublic<CourseListData>("/courses?courseType=BATCH");
    courses = data.courses ?? [];
  } catch {
    courses = [];
  }

  if (courses.length === 0) return null;

  const cards = courses
    .map((course) => {
      const pick = pickBatch(course);
      return {
        course,
        batch: pick.batch,
        kind: pick.kind,
        enrollments: course._count?.enrollments ?? 0,
      };
    })
    .sort((a, b) => {
      const at = a.batch?.startDate
        ? new Date(a.batch.startDate).getTime()
        : Number.POSITIVE_INFINITY;
      const bt = b.batch?.startDate
        ? new Date(b.batch.startDate).getTime()
        : Number.POSITIVE_INFINITY;
      return at - bt;
    });

  return (
    <section className="section-y bg-background">
      <div className="page-container">
        <Reveal className="max-w-2xl">
          <h2 className="text-2xl leading-tight font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
            Learn together in a live batch
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Fixed start and end dates, live classes and a cohort of learners on
            the same track.
          </p>
        </Reveal>

        <div
          className={cn(
            "mt-10 grid gap-5",
            cards.length === 1
              ? "mx-auto max-w-md"
              : "sm:grid-cols-2 lg:grid-cols-3"
          )}
        >
          {cards.slice(0, 3).map(({ course, batch, kind, enrollments }, i) => {
            const chip = statusChip(batch?.status);
            const startsAt = batch?.startDate;
            const endsAt = batch?.endDate;

            return (
              <Reveal key={course.id} delay={i * 0.08} className="h-full">
                <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
                  <CourseThumbnail
                    src={course.thumbnail}
                    alt={course.title}
                    courseType="BATCH"
                  />

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold",
                          chip.className
                        )}
                      >
                        {chip.pulse ? (
                          <span className="relative flex size-2">
                            <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60 motion-reduce:animate-none" />
                            <span className="relative inline-flex size-2 rounded-full bg-current" />
                          </span>
                        ) : null}
                        {chip.label}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">
                        {batch ? `Batch-${batch.batchNumber}` : "Batch TBA"}
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg leading-snug font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-xl">
                      {course.title}
                    </h3>
                    {batch?.title ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {batch.title}
                      </p>
                    ) : null}

                    <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2.5">
                        <CalendarDays className="size-4 shrink-0 text-primary" />
                        <span>
                          Starts{" "}
                          <span className="font-medium text-foreground">
                            {formatDate(startsAt)}
                          </span>
                        </span>
                      </li>
                      {endsAt ? (
                        <li className="flex items-center gap-2.5">
                          <CalendarRange className="size-4 shrink-0 text-primary" />
                          <span>
                            Ends{" "}
                            <span className="font-medium text-foreground">
                              {formatDate(endsAt)}
                            </span>
                          </span>
                        </li>
                      ) : null}
                      <li className="flex items-center gap-2.5">
                        <Users className="size-4 shrink-0 text-primary" />
                        <span>
                          <span className="font-medium text-foreground">
                            {enrollments}
                          </span>{" "}
                          learners enrolled
                        </span>
                      </li>
                    </ul>

                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
                      <p className="text-lg font-bold tracking-tight text-foreground">
                        {formatPrice(course.price)}
                      </p>
                      <Link
                        href={`/courses/${course.slug}`}
                        className={cn(
                          buttonVariants(),
                          "gap-2 rounded-xl"
                        )}
                      >
                        {kind === "active" ? "Enroll now" : "View batch"}
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>

        <Reveal className="mt-10 text-center">
          <Link
            href="/courses?courseType=BATCH"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "gap-2 rounded-xl"
            )}
          >
            View all batches
            <ArrowRight className="size-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

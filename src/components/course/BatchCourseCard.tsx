"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Clock } from "lucide-react";
import { cn } from "cn";

import type { Course } from "@/types";
import {
  batchCountdownText,
  daysUntil,
  formatDate,
  formatPrice,
  LEVEL_BADGE_CLASS,
  pickBatch,
  type BatchKind,
} from "@/lib/course-utils";
import { CourseThumbnail } from "@/components/course/CourseThumbnail";

const STRIP_STYLES: Record<BatchKind, string> = {
  active: "bg-gradient-to-r from-green-500 to-emerald-500 text-white",
  upcoming: "bg-gradient-to-r from-amber-400 to-orange-400 text-white",
  completed: "bg-gray-200 text-gray-600",
  none: "bg-gray-200 text-gray-600",
};

export function BatchCourseCard({ course }: { course: Course }) {
  const pick = pickBatch(course);
  const isFree = course.price === 0;

  const stripLabel =
    pick.kind === "active"
      ? "🔥 Enrolling Now"
      : pick.kind === "upcoming"
        ? `⏰ Starting ${formatDate(pick.batch?.startDate)}`
        : pick.kind === "completed"
          ? "✓ Completed"
          : "🔒 Coming Soon";

  const days = daysUntil(pick.batch?.startDate);

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <article className="flex h-full flex-col overflow-hidden rounded-2xl border bg-card ring-1 ring-foreground/5 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary group-hover:shadow-lg group-hover:shadow-primary/10">
        <div
          className={cn(
            "flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold tracking-wide",
            STRIP_STYLES[pick.kind]
          )}
        >
          {stripLabel}
        </div>

        <CourseThumbnail
          src={course.thumbnail}
          alt={course.title}
          courseType={course.courseType}
        />

        <div className="flex flex-1 flex-col gap-3 p-5">
          <span
            className={cn(
              "w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold",
              LEVEL_BADGE_CLASS[course.level]
            )}
          >
            {course.level}
          </span>

          <h3 className="line-clamp-2 font-heading text-lg leading-snug font-semibold transition-colors group-hover:text-primary">
            {course.title}
          </h3>

          <p className="line-clamp-2 text-sm text-muted-foreground">
            {course.description}
          </p>

          <div className="mt-auto space-y-3 pt-3">
            <div className="space-y-2 border-t pt-3 text-xs text-muted-foreground">
              <p className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3.5" />
                <span className="font-medium text-foreground">Next Batch:</span>
                {formatDate(pick.batch?.startDate)}
              </p>
              <p className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5" />
                {pick.kind === "upcoming" && days !== null && days > 0 ? (
                  <>
                    Enrollment ends in{" "}
                    <span className="font-semibold text-amber-600">
                      {days} day{days === 1 ? "" : "s"}
                    </span>
                  </>
                ) : (
                  batchCountdownText(pick)
                )}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "text-base font-bold",
                  isFree ? "text-green-600" : "text-foreground"
                )}
              >
                {formatPrice(course.price)}
              </span>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                Enroll Now
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

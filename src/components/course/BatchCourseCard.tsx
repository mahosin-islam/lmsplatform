"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { cn } from "cn";

import type { Course } from "@/types";
import {
  formatDate,
  formatPrice,
  LEVEL_BADGE_CLASS,
  pickBatch,
  type BatchKind,
} from "@/lib/course-utils";
import { CourseThumbnail } from "@/components/course/CourseThumbnail";

const STATUS: Record<
  BatchKind,
  { label: string; className: string; pulse?: boolean }
> = {
  active: {
    label: "Enrolling Now",
    className: "bg-green-100 text-green-700",
    pulse: true,
  },
  upcoming: { label: "Starting Soon", className: "bg-amber-100 text-amber-700" },
  completed: { label: "Batch Completed", className: "bg-gray-200 text-gray-600" },
  none: { label: "Coming Soon", className: "bg-gray-200 text-gray-600" },
};

export function BatchCourseCard({ course }: { course: Course }) {
  const pick = pickBatch(course);
  const isFree = course.price === 0;
  const status = STATUS[pick.kind];

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group block h-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <article className="flex h-full flex-col overflow-hidden rounded-xl border bg-card transition-all duration-200 hover:border-primary/50 hover:shadow-lg">
        <div className="relative">
          <CourseThumbnail
            src={course.thumbnail}
            alt={course.title}
            courseType={course.courseType}
          />
          <span
            className={cn(
              "absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold shadow-sm",
              status.className
            )}
          >
            {status.pulse && (
              <span className="size-1.5 animate-pulse rounded-full bg-green-500" />
            )}
            {status.label}
          </span>
        </div>

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
            <div className="flex items-center justify-between gap-2 border-t pt-3">
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="size-3.5" />
                <span className="font-medium text-foreground">
                  {formatDate(pick.batch?.startDate)}
                </span>
              </span>
              <span
                className={cn(
                  "text-base font-bold",
                  isFree ? "text-green-600" : "text-foreground"
                )}
              >
                {formatPrice(course.price)}
              </span>
            </div>

            <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground transition-colors group-hover:bg-primary/90">
              Enroll Now
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
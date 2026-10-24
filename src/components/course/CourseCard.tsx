"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, MessageSquare, Users } from "lucide-react";
import { cn } from "cn";

import type { Course } from "@/types";
import {
  batchCountdownText,
  formatDate,
  formatPrice,
  LEVEL_BADGE_CLASS,
  LEVEL_LABEL,
  pickBatch,
} from "@/lib/course-utils";
import { CourseThumbnail } from "@/components/course/CourseThumbnail";

type CourseCardVariant = "fixed" | "batch";

interface CourseCardProps {
  course: Course;
  variant?: CourseCardVariant;
}

export function CourseCard({ course, variant = "fixed" }: CourseCardProps) {
  const modules = course._count?.modules ?? course.modules?.length ?? 0;
  const students = course._count?.enrollments ?? 0;
  const reviews = course._count?.reviews ?? 0;
  const isFree = course.price === 0;
  const isBatch = variant === "batch";

  const pick = pickBatch(course);
  const startDate = pick.batch?.startDate;
  const batchChip =
    pick.kind === "active"
      ? batchCountdownText(pick)
      : pick.kind === "upcoming" && startDate
        ? `Starts ${formatDate(startDate)}`
        : pick.kind === "none"
          ? "Coming soon"
          : null;

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
        <CourseThumbnail
          src={course.thumbnail}
          alt={course.title}
          courseType={course.courseType}
        />

        <div className="flex flex-1 flex-col p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                LEVEL_BADGE_CLASS[course.level]
              )}
            >
              {LEVEL_LABEL[course.level]}
            </span>
            {isBatch && batchChip ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-teal/10 px-2.5 py-0.5 text-xs font-medium text-brand-teal-strong">
                <CalendarDays className="size-3.5" />
                {batchChip}
              </span>
            ) : null}
          </div>

          <h3 className="mt-3 line-clamp-2 text-base leading-snug font-semibold text-foreground transition-colors group-hover:text-primary">
            {course.title}
          </h3>

          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {course.description}
          </p>

          <div className="mt-auto pt-4">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="size-3.5" />
                {modules} modules
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-3.5" />
                {students} learners
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MessageSquare className="size-3.5" />
                {reviews} reviews
              </span>
            </div>

            <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-border pt-3.5">
              <span
                className={cn(
                  "text-lg font-bold tracking-tight",
                  isFree ? "text-brand-teal-strong" : "text-foreground"
                )}
              >
                {formatPrice(course.price)}
              </span>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                {isBatch ? "Enroll now" : "View course"}
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

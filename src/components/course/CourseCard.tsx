"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Star, Users } from "lucide-react";
import { cn } from "cn";

import type { Course } from "@/types";
import {
  formatPrice,
  LEVEL_BADGE_CLASS,
} from "@/lib/course-utils";
import { CourseThumbnail } from "@/components/course/CourseThumbnail";

export function CourseCard({ course }: { course: Course }) {
  const modules = course._count?.modules ?? course.modules?.length ?? 0;
  const students = course._count?.enrollments ?? 0;
  const reviews = course._count?.reviews ?? 0;
  const isFree = course.price === 0;

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <article className="flex h-full flex-col overflow-hidden rounded-2xl border bg-card ring-1 ring-foreground/5 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary group-hover:shadow-lg group-hover:shadow-primary/10">
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
            <div className="flex items-center gap-3 border-t pt-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <BookOpen className="size-3.5" />
                {modules} modules
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="size-3.5" />
                {students} students
              </span>
              <span className="inline-flex items-center gap-1">
                <Star className="size-3.5 text-amber-400" />
                {reviews > 0 ? reviews : "New"}
              </span>
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
                View Course
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

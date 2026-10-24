import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  MessageSquare,
  Users,
} from "lucide-react";
import { cn } from "cn";

import type { Course } from "@/types";
import {
  formatPrice,
  LEVEL_BADGE_CLASS,
  LEVEL_LABEL,
} from "@/lib/course-utils";
import { CourseThumbnail } from "@/components/course/CourseThumbnail";

interface FeaturedCourseCardProps {
  course: Course;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] ?? ""}${parts.length > 1 ? parts[parts.length - 1][0] : ""}`.toUpperCase();
}

export function FeaturedCourseCard({ course }: FeaturedCourseCardProps) {
  const modules = course._count?.modules ?? course.modules?.length ?? 0;
  const students = course._count?.enrollments ?? 0;
  const reviews = course._count?.reviews ?? 0;
  const isFree = course.price === 0;
  const instructor = course.admin;

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
        <CourseThumbnail
          src={course.thumbnail}
          alt={course.title}
          courseType={course.courseType}
        />

        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                LEVEL_BADGE_CLASS[course.level]
              )}
            >
              {LEVEL_LABEL[course.level]}
            </span>
            {isFree ? (
              <span className="text-[11px] font-semibold text-brand-teal-strong">
                Free access
              </span>
            ) : null}
          </div>

          <h3 className="mt-2.5 line-clamp-2 text-lg leading-snug font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-xl">
            {course.title}
          </h3>

          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {course.description}
          </p>

          <div className="mt-3.5 flex items-center gap-2">
            {instructor?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={instructor.avatar}
                alt={instructor.name}
                loading="lazy"
                className="size-6 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                {initials(instructor?.name ?? "LMS")}
              </span>
            )}
            <span className="truncate text-xs font-medium text-muted-foreground">
              {instructor?.name ?? "Platform instructor"}
            </span>
          </div>

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
                View course
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

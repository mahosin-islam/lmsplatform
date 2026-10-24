"use client";

import type { Course } from "@/types";
import { CourseCard } from "@/components/course/CourseCard";

/**
 * Thin wrapper kept so existing imports keep working.
 * Renders the exact same card shell as `CourseCard` so both grids on the
 * courses page share one spacing / border / typography system.
 */
export function BatchCourseCard({ course }: { course: Course }) {
  return <CourseCard course={course} variant="batch" />;
}

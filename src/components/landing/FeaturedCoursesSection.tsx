import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { fetchPublic } from "@/lib/api-server";
import type { Course, CourseListData } from "@/types";
import { CourseCard } from "@/components/course/CourseCard";

export async function FeaturedCoursesSection() {
  let courses: Course[] = [];

  try {
    const data = await fetchPublic<CourseListData>("/courses?status=PUBLISHED");
    courses = data.courses ?? [];
  } catch {
    courses = [];
  }

  if (courses.length === 0) return null;

  const featured = [...courses]
    .sort((a, b) => {
      const enrollDiff =
        (b._count?.enrollments ?? 0) - (a._count?.enrollments ?? 0);
      if (enrollDiff !== 0) return enrollDiff;
      const reviewDiff = (b._count?.reviews ?? 0) - (a._count?.reviews ?? 0);
      if (reviewDiff !== 0) return reviewDiff;
      return b.createdAt.localeCompare(a.createdAt);
    })
    .slice(0, 6);

  return (
    <section className="bg-slate-50 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
            📚 Popular Courses
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">
            Courses our learners love most
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">
            {courses.length} published course
            {courses.length === 1 ? "" : "s"} available right now — start with
            what other students are already taking.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-indigo-300 hover:text-indigo-600 hover:shadow-md"
          >
            Browse all courses
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

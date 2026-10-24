import { fetchPublic } from "@/lib/api-server";
import type { Course, CourseListData } from "@/types";
import { Reveal } from "@/components/shared/Reveal";
import { FeaturedCourseCard } from "@/components/landing/FeaturedCourseCard";

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
    .slice(0, 3);

  return (
    <section className="section-y bg-background">
      <div className="page-container">
        <Reveal className="max-w-2xl">
          <h2 className="text-2xl leading-tight font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
            Find a course that fits you
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Self-paced courses and scheduled live batches, taught by instructors
            on this platform.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((course, i) => (
            <Reveal key={course.id} delay={i * 0.08} className="h-full">
              <FeaturedCourseCard course={course} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

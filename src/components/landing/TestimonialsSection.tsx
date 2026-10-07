import { Quote, Star } from "lucide-react";
import { cn } from "cn";

import { fetchPublic } from "@/lib/api-server";
import type { CourseListData, ReviewListData } from "@/types";

interface Testimonial {
  id: string;
  name: string;
  rating: number;
  comment: string;
  avatar: string | null;
  courseTitle: string | null;
}
function getUserInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase() || "?";
}



async function fetchAllTestimonials(): Promise<Testimonial[]> {
  const data = await fetchPublic<CourseListData>("/courses");

  const candidates = data.courses.filter(
    (course) =>
      course._count?.reviews === undefined || course._count.reviews > 0
  );

  const grouped = await Promise.all(
    candidates.map(async (course) => {
      try {
        const reviews = await fetchPublic<ReviewListData>(
          `/reviews/course/${course.id}`
        );
        return (reviews.reviews ?? []).map((review) => ({ review, course }));
      } catch {
        return [];
      }
    })
  );

  return grouped
    .flat()
    .sort((a, b) => b.review.createdAt.localeCompare(a.review.createdAt))
    .map(({ review, course }) => ({
      id: review.id,
      name: review.learner?.name ?? "Anonymous",
      rating: review.rating,
      comment: review.comment?.trim() ?? "",
      avatar: review.learner?.avatar ?? null,
      courseTitle: course.title,
    }));
}

interface TestimonialCardProps {
  testimonial: Testimonial;
}

function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <figure className="flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-7 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <Quote className="size-8 text-indigo-200" />
      <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-slate-600">
        {testimonial.comment ? (
          <>
            &ldquo;{testimonial.comment}&rdquo;
          </>
        ) : (
          <span className="italic text-slate-400">
            Rated {testimonial.rating} out of 5 stars without a written comment.
          </span>
        )}
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
        {testimonial.avatar ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={testimonial.avatar}
              alt={testimonial.name}
              loading="lazy"
              className="size-11 shrink-0 rounded-full object-cover"
            />
          </>
        ) : (
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
            {getUserInitials(testimonial.name)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900">
            {testimonial.name}
          </p>
          {testimonial.courseTitle ? (
            <p className="truncate text-xs text-slate-500">
              {testimonial.courseTitle}
            </p>
          ) : null}
          <span className="mt-1 inline-flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "size-3.5",
                  star <= testimonial.rating
                    ? "fill-amber-400 text-amber-400"
                    : "fill-slate-200 text-slate-200"
                )}
              />
            ))}
          </span>
        </div>
      </figcaption>
    </figure>
  );
}



export async function TestimonialsSection() {


  
  let testimonials: Testimonial[] = [];

  try {
    testimonials = await fetchAllTestimonials();
  } catch {
    testimonials = [];
  }

  const total = testimonials.length;
  const average =
    total > 0
      ? (
          testimonials.reduce((sum, item) => sum + item.rating, 0) / total
        ).toFixed(1)
      : "0.0";
  const roundedAverage = Math.round(Number(average));





  

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
            💬 What Our Students Say
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">
            Real reviews from real learners
          </h2>
          {total > 0 ? (
            <p className="mt-3 inline-flex items-center justify-center gap-2 text-sm text-slate-500">
              <span className="inline-flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      "size-4",
                      star <= roundedAverage
                        ? "fill-amber-400 text-amber-400"
                        : "fill-slate-200 text-slate-200"
                    )}
                  />
                ))}
              </span>
              <span>
                {average} average · {total}{" "}
                {total === 1 ? "review" : "reviews"}
              </span>
            </p>
          ) : null}
        </div>

        {total === 0 ? (
          <div className="mt-12 flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
            <Quote className="size-9 text-indigo-200" />
            <p className="mt-4 text-lg font-semibold text-slate-900">
              No reviews yet
            </p>
            <p className="mt-1 max-w-md text-sm text-slate-500">
              Once learners finish and review a course, their feedback will
              show up right here.
            </p>
          </div>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <TestimonialCard
                key={testimonial.id}
                testimonial={testimonial}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

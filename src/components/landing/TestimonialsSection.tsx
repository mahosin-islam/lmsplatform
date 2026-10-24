import { Quote, Star } from "lucide-react";
import { cn } from "cn";

import { fetchPublic } from "@/lib/api-server";
import type { CourseListData, ReviewListData } from "@/types";
import { Reveal } from "@/components/shared/Reveal";

interface Testimonial {
  id: string;
  name: string;
  rating: number;
  comment: string;
  avatar: string | null;
  courseTitle: string | null;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase() || "?";
}

async function fetchTestimonials(): Promise<Testimonial[]> {
  const data = await fetchPublic<CourseListData>("/courses");

  const candidates = data.courses.filter(
    (course) => (course._count?.reviews ?? 0) > 0
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
      name: review.learner?.name ?? "Anonymous learner",
      rating: review.rating,
      comment: review.comment?.trim() ?? "",
      avatar: review.learner?.avatar ?? null,
      courseTitle: course.title,
    }))
    .filter((item) => item.comment.length > 0)
    .slice(0, 3);
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
      <div className="flex items-center justify-between">
        <Quote className="size-7 text-primary/25" />
        <span className="inline-flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                "size-3.5",
                star <= testimonial.rating
                  ? "fill-amber-400 text-amber-400"
                  : "fill-muted-foreground/25 text-muted-foreground/25"
              )}
            />
          ))}
        </span>
      </div>

      <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
        &ldquo;{testimonial.comment}&rdquo;
      </blockquote>

      <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-5">
        {testimonial.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={testimonial.avatar}
            alt={testimonial.name}
            loading="lazy"
            className="size-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {initials(testimonial.name)}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {testimonial.name}
          </p>
          {testimonial.courseTitle ? (
            <p className="truncate text-xs text-muted-foreground">
              {testimonial.courseTitle}
            </p>
          ) : null}
        </div>
      </figcaption>
    </figure>
  );
}

export async function TestimonialsSection() {
  let testimonials: Testimonial[] = [];

  try {
    testimonials = await fetchTestimonials();
  } catch {
    testimonials = [];
  }

  if (testimonials.length === 0) return null;

  const average = (
    testimonials.reduce((sum, item) => sum + item.rating, 0) /
    testimonials.length
  ).toFixed(1);

  return (
    <section className="section-y border-y border-border bg-muted/40">
      <div className="page-container">
        <Reveal className="max-w-2xl">
          <h2 className="text-2xl leading-tight font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
            What learners say
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Reviews written by learners enrolled on this platform.
          </p>
        </Reveal>

        <div className="mt-5 flex justify-start">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "size-3.5",
                    star <= Math.round(Number(average))
                      ? "fill-amber-400 text-amber-400"
                      : "fill-muted-foreground/25 text-muted-foreground/25"
                  )}
                />
              ))}
            </span>
            {average} average · {testimonials.length}{" "}
            {testimonials.length === 1 ? "review" : "reviews"}
          </span>
        </div>

        <div
          className={cn(
            "mt-8 grid gap-5",
            testimonials.length === 1
              ? "mx-auto max-w-md"
              : testimonials.length === 2
                ? "mx-auto max-w-2xl md:grid-cols-2"
                : "md:grid-cols-3"
          )}
        >
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}

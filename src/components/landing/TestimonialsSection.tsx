import { Quote, Star } from "lucide-react";
import { cn } from "cn";

import { fetchPublic } from "@/lib/api-server";
import type { CourseListData, ReviewListData } from "@/types";

interface Testimonial {
  name: string;
  rating: number;
  comment: string;
  avatar: string;
}

const FALLBACKS: Testimonial[] = [
  {
    name: "Mahosin",
    rating: 5,
    comment:
      "Best course! My English improved so much in just a few weeks of daily practice.",
    avatar: "https://i.pravatar.cc/100?img=1",
  },
  {
    name: "Sarah",
    rating: 5,
    comment:
      "Amazing platform. The live batches made speaking practice way less intimidating.",
    avatar: "https://i.pravatar.cc/100?img=5",
  },
  {
    name: "Rafi",
    rating: 4,
    comment:
      "Great course structure and helpful instructors. The self-paced lessons fit my schedule perfectly.",
    avatar: "https://i.pravatar.cc/100?img=11",
  },
];

const FALLBACK_AVATARS = [1, 5, 11, 12, 24, 32];

interface TestimonialCardProps {
  testimonial: Testimonial;
}

function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <figure className="flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-7 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <Quote className="size-8 text-indigo-200" />
      <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-slate-600">
        &ldquo;{testimonial.comment}&rdquo;
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={testimonial.avatar}
          alt={testimonial.name}
          loading="lazy"
          className="size-11 shrink-0 rounded-full object-cover"
        />
        <div>
          <p className="font-semibold text-slate-900">{testimonial.name}</p>
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
  let testimonials: Testimonial[] = FALLBACKS;

  try {
    const data = await fetchPublic<CourseListData>("/courses");
    const course =
      data.courses.find((item) => (item._count?.reviews ?? 0) > 0) ??
      data.courses[0];

    if (course) {
      const reviews = await fetchPublic<ReviewListData>(
        `/reviews/course/${course.id}`
      );
      if (reviews.reviews?.length > 0) {
        testimonials = reviews.reviews.slice(0, 3).map((review, index) => ({
          name: review.learner?.name ?? "Anonymous",
          rating: review.rating,
          comment:
            review.comment ||
            "Great course quality and support from the instructors!",
          avatar:
            review.learner?.avatar ??
            `https://i.pravatar.cc/100?img=${
              FALLBACK_AVATARS[index % FALLBACK_AVATARS.length]
            }`,
        }));
      }
    }
  } catch {
    testimonials = FALLBACKS;
  }

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
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.name} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}
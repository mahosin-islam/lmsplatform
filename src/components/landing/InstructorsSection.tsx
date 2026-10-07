import { BookOpen, GraduationCap, Star, Users } from "lucide-react";

interface Instructor {
  name: string;
  role: string;
  courses: number;
  students: string;
  rating: number;
  avatar: string;
}

const INSTRUCTORS: Instructor[] = [

  {
    name: "Tanvir Ahmed",
    role: "Business English Trainer",
    courses: 2,
    students: "640+",
    rating: 4.7,
    avatar: "https://i.pravatar.cc/300?img=12",
  },
  {
    name: "Farhana Karim",
    role: "Beginner English Facilitator",
    courses: 2,
    students: "750+",
    rating: 4.8,
    avatar: "https://i.pravatar.cc/300?img=32",
  },
  {
    name: "Rakib Islam",
    role: "Conversation Practice Host",
    courses: 2,
    students: "520+",
    rating: 4.9,
    avatar: "https://i.pravatar.cc/300?img=13",
  },
];

export function InstructorsSection() {
  return (
    <section className="bg-background py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            👩‍🏫 Expert Instructors
          </p>
          <h2 className="mt-2 text-3xl font-bold text-foreground md:text-4xl">
            Meet the experts behind our courses
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Every course is designed and taught by instructors who actually
            build the lessons, grade your work, and run the live sessions.
          </p>
        </div>

        <div className="relative -mx-4 mt-12 overflow-hidden px-4 [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
          <div className="group flex w-max animate-[marquee_45s_linear_infinite] hover:[animation-play-state:paused] motion-reduce:animate-none">
            {[0, 1].map((copy) => (
              <div
                key={copy}
                className="flex gap-6 pr-6"
                aria-hidden={copy === 1}
              >
                {INSTRUCTORS.map((instructor) => (
                  <article
                    key={instructor.name}
                    className="group/card flex w-[17.5rem] shrink-0 flex-col items-center rounded-2xl border border-border/70 bg-card px-6 py-7 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/35 hover:shadow-md"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={instructor.avatar}
                      alt={instructor.name}
                      loading="lazy"
                      className="size-20 rounded-full object-cover ring-2 ring-primary/20 transition-all duration-300 group-hover/card:ring-primary/45"
                    />

                    <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold tracking-wider text-accent-foreground uppercase">
                      <GraduationCap className="size-3.5" />
                      Mentor
                    </span>

                    <h3 className="mt-3 text-base font-bold text-foreground">
                      {instructor.name}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-primary">
                      {instructor.role}
                    </p>

                    <div className="mt-4 flex w-full items-center justify-center gap-4 border-t border-border/60 pt-4 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Star className="size-3.5 fill-amber-400 text-amber-400" />
                        {instructor.rating}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <BookOpen className="size-3.5 text-primary" />
                        {instructor.courses}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="size-3.5 text-primary" />
                        {instructor.students}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

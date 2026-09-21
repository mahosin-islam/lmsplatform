import { Award, GraduationCap, MessageSquare, Video } from "lucide-react";
import { cn } from "cn";

const FEATURES = [
  {
    icon: GraduationCap,
    title: "Expert Teachers",
    description:
      "Learn from experienced instructors who are passionate about teaching English.",
    className: "bg-indigo-50 text-indigo-600",
  },
  {
    icon: Video,
    title: "HD Video Lessons",
    description:
      "Crystal-clear video lessons you can watch anytime, on any device.",
    className: "bg-blue-50 text-blue-600",
  },
  {
    icon: Award,
    title: "Certificates",
    description:
      "Earn shareable certificates of completion to showcase your skills.",
    className: "bg-amber-50 text-amber-600",
  },
  {
    icon: MessageSquare,
    title: "Live Support",
    description:
      "Get help from instructors and peers through live discussions.",
    className: "bg-emerald-50 text-emerald-600",
  },
];

export function FeaturesSection() {
  return (
    <section className="bg-slate-50 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
            🎯 Why Choose Us?
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">
            Everything you need to master English
          </h2>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, description, className }) => (
            <div
              key={title}
              className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              <span
                className={cn(
                  "mx-auto inline-flex size-14 items-center justify-center rounded-2xl",
                  className
                )}
              >
                <Icon className="size-7" />
              </span>
              <h3 className="mt-5 text-lg font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
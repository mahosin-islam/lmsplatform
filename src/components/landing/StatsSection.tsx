import { BookOpen, GraduationCap, Star, Users } from "lucide-react";

const STATS = [
  { icon: Users, value: "10K+", label: "Students" },
  { icon: BookOpen, value: "50+", label: "Courses" },
  { icon: GraduationCap, value: "5K+", label: "Certified" },
  { icon: Star, value: "4.9", label: "Rating" },
];

export function StatsSection() {
  return (
    <section className="border-b border-slate-200 bg-white py-10 md:py-14">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
        {STATS.map(({ icon: Icon, value, label }) => (
          <div key={label} className="flex flex-col items-center text-center">
            <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/20">
              <Icon className="size-6" />
            </span>
            <p className="mt-3 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-3xl font-bold text-transparent">
              {value}
            </p>
            <p className="mt-1 text-sm text-slate-600">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
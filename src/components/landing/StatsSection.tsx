"use client";

import { motion, Variants } from "framer-motion";
import { BookOpen, GraduationCap, Star, Users } from "lucide-react";

const STATS = [
  { icon: Users, value: "10K+", label: "Students" },
  { icon: BookOpen, value: "50+", label: "Courses" },
  { icon: GraduationCap, value: "5K+", label: "Certified" },
  { icon: Star, value: "4.9", label: "Rating" },
];

// Explicitly typing variants using `Variants` type from framer-motion
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 25, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.21, 0.47, 0.32, 0.98], // Custom smooth cubic-bezier
    },
  },
};

export function StatsSection() {
  return (
    <section className="border-b border-slate-200 bg-white py-10 md:py-14">
      <motion.div
        className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 sm:px-6 lg:grid-cols-4 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        {STATS.map(({ icon: Icon, value, label }) => (
          <motion.div
            key={label}
            variants={itemVariants}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="flex flex-col items-center text-center cursor-default group"
          >
            <motion.span
              whileHover={{ rotate: 8, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="inline-flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/20 group-hover:shadow-indigo-600/40 transition-shadow duration-300"
            >
              <Icon className="size-6" />
            </motion.span>
            <p className="mt-3 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-3xl font-bold text-transparent">
              {value}
            </p>
            <p className="mt-1 text-sm font-medium text-slate-600">{label}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
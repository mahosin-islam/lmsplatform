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
    <section className="border-b border-border bg-background py-10 md:py-12">
      <motion.div
        className="page-container grid grid-cols-2 gap-6 lg:grid-cols-4"
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
              className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm transition-shadow duration-300"
            >
              <Icon className="size-6" />
            </motion.span>
            <p className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {value}
            </p>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              {label}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
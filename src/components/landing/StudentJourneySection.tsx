"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  MessageSquare,
  UserCheck,
  BookOpen,
  Edit3,
  Briefcase,
  Award,
  Target,
  TrendingUp,
  PhoneCall,
  ArrowRight,
} from "lucide-react";

interface Step {
  id: string;
  number: string;
  title: string;
  icon: React.ElementType;
}

const STEPS: Step[] = [
  { id: "step-1", number: "01", title: "Career Counselling", icon: MessageSquare },
  { id: "step-2", number: "02", title: "Admission & Onboarding", icon: UserCheck },
  { id: "step-3", number: "03", title: "Course Start", icon: BookOpen },
  { id: "step-4", number: "04", title: "Learning & Practice", icon: Edit3 },
  { id: "step-5", number: "05", title: "Project & Portfolio Building", icon: Briefcase },
  { id: "step-6", number: "06", title: "Assessment & Certification", icon: Award },
  { id: "step-7", number: "07", title: "Career Preparation", icon: Target },
  { id: "step-8", number: "08", title: "Career & Earning", icon: TrendingUp },
];

export default function StudentJourneySection() {
  const totalSteps = STEPS.length;
  const radius = 210; // Circular orbit radius in px

  return (
    <section className="section-y overflow-hidden bg-background">
      <div className="page-container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Text Column */}
          <div className="space-y-5 text-left lg:col-span-5">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary bg-primary/5 px-3 py-1 rounded-md border border-primary/10">
                <span className="w-2 h-0.5 bg-emerald-500 rounded-full" />
                How It Works
              </span>
              <h2 className="mt-4 text-2xl leading-tight font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                Student Career Journey
              </h2>
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              From your first free seminar to your first job offer, every step of your journey is planned and supported. You choose the right course with an advisor, learn through hands-on projects, build a professional portfolio and get prepared for interviews and marketplaces.
            </p>

            <p className="text-sm leading-relaxed text-muted-foreground">
              Our career placement team then connects you with companies that match your skills, and our support continues long after you graduate.
            </p>

            {/* Help Desk Callout Box */}
            <div className="pt-2">
              <a
                href="tel:+8801777308777"
                className="group inline-flex items-center gap-4 rounded-full border border-border bg-card p-2 pr-6 shadow-md transition-all duration-300 hover:shadow-lg"
              >
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground group-hover:scale-105 transition-transform">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                    Help Desk . Call Now
                  </span>
                  <span className="flex items-center gap-2 text-base font-bold text-foreground">
                    +8801315848755
                    <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </a>
            </div>
          </div>

          {/* Right Circular Orbit Visual Column */}
          <div className="lg:col-span-7 flex items-center justify-center relative min-h-[500px] sm:min-h-[560px]">
            {/* Center Glowing Atmosphere & Student Avatar */}
            <div className="relative z-10 w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-primary/5 p-4 flex items-center justify-center border border-primary/10 shadow-inner">
              <div className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                <Image
                  src="https://res.cloudinary.com/dzoigbkep/image/upload/v1792773977/gvkwko5clyllkwhfdppj.png"
                  alt="Student Learner"
                  fill
                  className="object-cover object-top"
                  unoptimized
                />
              </div>
            </div>

            {/* SVG Orbit Path */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 520 520"
            >
              <circle
                cx="260"
                cy="260"
                r={radius}
                className="stroke-emerald-400/50 dark:stroke-emerald-600/40"
                strokeWidth="2"
                fill="none"
                strokeDasharray="6 6"
              />
            </svg>

            {/* Rotating Nodes Wrapper */}
            <motion.div
              className="absolute inset-0 w-full h-full flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{
                duration: 60,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              {STEPS.map((step, index) => {
                const angleDegree = (index * 360) / totalSteps - 90;
                const angleRad = (angleDegree * Math.PI) / 180;
                const x = radius * Math.cos(angleRad);
                const y = radius * Math.sin(angleRad);
                const IconComponent = step.icon;

                return (
                  <div
                    key={step.id}
                    className="absolute flex items-center gap-2 group cursor-pointer"
                    style={{
                      transform: `translate(${x}px, ${y}px)`,
                    }}
                  >
                    {/* Counter-rotate internal elements to keep text upright */}
                    <motion.div
                      className="flex items-center gap-2"
                      animate={{ rotate: -360 }}
                      transition={{
                        duration: 60,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      {/* Node Icon Badge */}
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-card text-primary shadow-md transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                        <IconComponent className="w-4 h-4" />
                      </div>

                      {/* Step Title Label Pill */}
                      <div className="rounded-full border border-border bg-card/90 px-3 py-1 text-xs font-semibold whitespace-nowrap text-foreground shadow-sm backdrop-blur-md transition-colors group-hover:border-primary">
                        <span className="mr-1.5 font-bold text-primary">{step.number}</span>
                        {step.title}
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </motion.div>

          </div>

        </div>
      </div>
    </section>
  );
}
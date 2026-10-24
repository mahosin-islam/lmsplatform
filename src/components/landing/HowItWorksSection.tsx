"use client";

import React from "react";
import {
  ClipboardCheck,
  MousePointerClick,
  PlayCircle,
  Sparkles,
  BookOpen,
  Briefcase,
  MessageCircle,
  GraduationCap,
} from "lucide-react";

// Types for How It Works Steps
interface StepItem {
  id: string;
  stepNumber: string;
  title: string;
  description: string;
  icon: React.ElementType;
  bgClass: string;
  textClass: string;
}

// Types for Course Categories
interface CourseCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

const STEPS: StepItem[] = [
  {
    id: "step-1",
    stepNumber: "01",
    title: "Take a quick test",
    description: "Find your English level in just 2 minutes — no pressure, just a starting point.",
    icon: ClipboardCheck,
    bgClass: "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
    textClass: "text-slate-900 dark:text-white",
  },
  {
    id: "step-2",
    stepNumber: "03",
    title: "Choose your course",
    description: "Pick the plan that fits your goals: beginner, conversation, business, or exam prep.",
    icon: MousePointerClick,
    bgClass: "bg-stone-200 dark:bg-slate-800 border-stone-300 dark:border-slate-700",
    textClass: "text-slate-900 dark:text-white",
  },
  {
    id: "step-3",
    stepNumber: "04",
    title: "Start learning online",
    description: "Access pre-recorded lessons anytime and join weekly video calls with native speaking tutors.",
    icon: PlayCircle,
    bgClass: "bg-blue-600 border-blue-500",
    textClass: "text-white",
  },
  {
    id: "step-4",
    stepNumber: "06",
    title: "Improve every day",
    description: "Track your progress, unlock new topics, and stay consistent with smart reminders.",
    icon: Sparkles,
    bgClass: "bg-slate-900 dark:bg-slate-950 border-slate-800",
    textClass: "text-white",
  },
];

const COURSE_CATEGORIES: CourseCategory[] = [
  {
    id: "cat-1",
    title: "Beginner English",
    description: "Practice real-life speaking to improve fluency, pronunciation, listening, and natural flow in everyday English conversations.",
    icon: BookOpen,
  },
  {
    id: "cat-2",
    title: "Business English",
    description: "Learn clear, professional English for emails, meetings, presentations, and interviews in any modern work environment.",
    icon: Briefcase,
  },
  {
    id: "cat-3",
    title: "Conversational English",
    description: "Practice real-life speaking to improve fluency, pronunciation, listening, and natural flow in everyday English conversations.",
    icon: MessageCircle,
  },
  {
    id: "cat-4",
    title: "IELTS / TOEFL Prep",
    description: "Prepare for exams with focused lessons, timed tasks, proven strategies, and expert tips to boost your overall score.",
    icon: GraduationCap,
  },
];

export default function HowItWorksSection() {
  return (
    <section className="section-y bg-muted/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid Wrapper for 2 Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
          
          {/* SECTION 1: How It Works (Left Side - 7 Columns) */}
          <div className="lg:col-span-7 bg-card rounded-3xl p-6 sm:p-8 border border-border shadow-sm">
            {/* Header */}
            <div className="text-center mb-10">
              <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-primary/5 text-primary mb-2 border border-primary/10">
                Simple process
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                How it works
              </h2>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
                Get started in minutes — choose your path, learn at your pace, and see real progress.
              </p>
            </div>

            {/* Timeline Steps Layout */}
            <div className="relative pl-4 sm:pl-8 space-y-6 before:absolute before:left-2 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.id} className="relative group">
                    {/* Node Dot on Timeline */}
                    <div className="absolute -left-[21px] sm:-left-[37px] top-4 w-3.5 h-3.5 rounded-full bg-white dark:bg-slate-900 border-2 border-blue-500 shadow-sm" />

                    {/* Step Card */}
                    <div className={`p-5 rounded-2xl border shadow-sm transition-all duration-300 hover:shadow-md ${step.bgClass}`}>
                      <div className="flex items-start gap-3.5">
                        <div className="p-2 rounded-xl bg-white/20 dark:bg-black/20 shrink-0">
                          <Icon className={`w-5 h-5 ${step.textClass}`} />
                        </div>
                        <div>
                          <h3 className={`text-base font-bold ${step.textClass}`}>
                            {step.title}
                          </h3>
                          <p className={`mt-1 text-xs sm:text-sm leading-relaxed opacity-90 ${step.textClass}`}>
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>


          {/* SECTION 2: Choose Course (Right Side - 5 Columns) */}
          <div className="lg:col-span-5 bg-card rounded-3xl p-6 sm:p-8 border border-border shadow-sm">
            {/* Header */}
            <div className="text-center mb-8">
              <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-primary/5 text-primary mb-2 border border-primary/10">
                Courses
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight leading-snug">
                Choose the right <br />
                <span className="text-muted-foreground font-normal">course for your goals</span>
              </h2>
            </div>

            {/* Course Cards List */}
            <div className="space-y-4">
              {COURSE_CATEGORIES.map((course) => {
                const Icon = course.icon;
                return (
                  <div
                    key={course.id}
                    className="p-5 rounded-2xl bg-muted/30 border border-border hover:border-primary/40 transition-all duration-300 group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                        {course.title}
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed pl-8">
                      {course.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Star, BookOpen, Users } from "lucide-react";

interface Instructor {
  id: number;
  name: string;
  role: string;
  courses: number;
  students: string;
  rating: number;
  avatar: string;
}

const INSTRUCTORS: Instructor[] = [
  {
    id: 1,
    name: "Sarah Rahman",
    role: "Spoken English Mentor",
    courses: 4,
    students: "1.2k+",
    rating: 4.9,
    avatar: "https://res.cloudinary.com/dzoigbkep/image/upload/v1792594805/rnxlza6yt6sr5aa7ewxj.png",
  },
  {
    id: 2,
    name: "Imran Hossain",
    role: "Grammar & Writing Specialist",
    courses: 3,
    students: "980+",
    rating: 4.8,
    avatar: "https://res.cloudinary.com/dzoigbkep/image/upload/v1792589940/mamlnxuhcsqobruqhh9g.png",
  },
  {
    id: 3,
    name: "Nusrat Jahan",
    role: "IELTS Preparation Coach",
    courses: 3,
    students: "860+",
    rating: 4.9,
    avatar: "https://res.cloudinary.com/dzoigbkep/image/upload/v1792594844/lmzqndknsgqpsiihastc.png",
  },
  {
    id: 4,
    name: "Tanvir Ahmed",
    role: "Business English Trainer",
    courses: 2,
    students: "640+",
    rating: 4.7,
    avatar: "https://res.cloudinary.com/dzoigbkep/image/upload/v1792594868/encgqofdqjshz0zusyvc.png",
  },
  {
    id: 5,
    name: "Farhana Karim",
    role: "Beginner English Facilitator",
    courses: 2,
    students: "750+",
    rating: 4.8,
    avatar: "https://res.cloudinary.com/dzoigbkep/image/upload/v1792594886/tezpzlv3jeohajkthdwh.png",
  },
];

// Infinite Seamless Loop এর জন্য Array-কে ডুপ্লিকেট করা হয়েছে
const MARQUEE_INSTRUCTORS = [...INSTRUCTORS, ...INSTRUCTORS];

export default function InstructorsSection() {
  return (
    <section className="section-y overflow-hidden border-y border-border bg-muted/40">
      <div className="page-container">
        <div className="max-w-2xl">
          <h2 className="text-2xl leading-tight font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
            Learn from Top Instructors
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Gain real-world fluency with guidance from our experienced mentors
            and language coaches.
          </p>
        </div>
      </div>

      {/* Infinite Marquee Loop Wrapper */}
      <div className="relative mt-10 flex w-full overflow-hidden mask-gradient-x">
        {/* Continuous Motion */}
        <motion.div
          className="flex gap-6 shrink-0 py-4 px-3"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            ease: "linear",
            duration: 25,
            repeat: Infinity,
          }}
          whileHover={{ animationPlayState: "paused" }}
        >
          {MARQUEE_INSTRUCTORS.map((instructor, index) => (
            <div
              key={`${instructor.id}-${index}`}
              className="group w-[280px] shrink-0 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:w-[320px]"
            >
              {/* Image Box */}
              <div className="relative mb-4 h-[220px] w-full overflow-hidden rounded-xl bg-muted">
                <Image
                  src={instructor.avatar}
                  alt={instructor.name}
                  fill
                  className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 280px, 320px"
                  unoptimized
                />
                <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full border border-border bg-card/90 px-2.5 py-1 text-xs font-semibold text-foreground shadow-sm backdrop-blur-md">
                  <Star className="w-3.5 h-3.5 fill-primary/80 text-primary/80" />
                  {instructor.rating.toFixed(1)}
                </div>
              </div>

              {/* Info */}
              <div className="space-y-1">
                <h3 className="text-lg font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-xl">
                  {instructor.name}
                </h3>
                <p className="text-xs font-medium text-muted-foreground">
                  {instructor.role}
                </p>
              </div>

              {/* Stats Border Divider */}
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs font-medium text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-primary" />
                  <span>{instructor.courses} Courses</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  <span>{instructor.students} Students</span>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
"use client";

import { GraduationCap } from "lucide-react";
import { cn } from "cn";

import type { CourseType } from "@/types";

interface CourseThumbnailProps {
  src: string | null;
  alt: string;
  courseType: CourseType;
  className?: string;
  badgeClassName?: string;
}

export function CourseThumbnail({
  src,
  alt,
  courseType,
  className,
  badgeClassName,
}: CourseThumbnailProps) {
  const label = courseType === "FIXED" ? "SELF-PACED" : "BATCH";

  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500",
        className
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <GraduationCap className="size-12 text-white/70" />
        </div>
      )}

      <span
        className={cn(
          "absolute top-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white uppercase backdrop-blur-sm",
          badgeClassName
        )}
      >
        {label}
      </span>
    </div>
  );
}

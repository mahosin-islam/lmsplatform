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
  const label = courseType === "FIXED" ? "Self-paced" : "Live batch";

  return (
    <div
      className={cn(
        "relative aspect-[16/9] w-full overflow-hidden bg-muted",
        className
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 via-background to-brand-teal/10">
          <GraduationCap className="size-10 text-primary/40" />
        </div>
      )}

      <span
        className={cn(
          "absolute top-3 right-3 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-semibold text-foreground uppercase backdrop-blur-sm",
          badgeClassName
        )}
      >
        {label}
      </span>
    </div>
  );
}

"use client";

import * as React from "react";
import {
  Bell,
  BookOpen,
  ClipboardList,
  GraduationCap,
  Megaphone,
  Video,
} from "lucide-react";

import { cn } from "cn";
import type { NotificationType } from "@/types";

export const NOTIFICATION_TYPE_META: Record<
  NotificationType,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    iconClass: string;
    badgeClass: string;
  }
> = {
  NEW_LESSON: {
    label: "New Lesson",
    icon: BookOpen,
    iconClass: "bg-blue-100 text-blue-600",
    badgeClass: "bg-blue-100 text-blue-700",
  },
  NEW_ASSIGNMENT: {
    label: "New Assignment",
    icon: ClipboardList,
    iconClass: "bg-purple-100 text-purple-600",
    badgeClass: "bg-purple-100 text-purple-700",
  },
  NEW_LIVE_CLASS: {
    label: "Live Class",
    icon: Video,
    iconClass: "bg-red-100 text-red-600",
    badgeClass: "bg-red-100 text-red-700",
  },
  ANNOUNCEMENT: {
    label: "Announcement",
    icon: Megaphone,
    iconClass: "bg-amber-100 text-amber-600",
    badgeClass: "bg-amber-100 text-amber-700",
  },
  COURSE_COMPLETED: {
    label: "Course Completed",
    icon: GraduationCap,
    iconClass: "bg-emerald-100 text-emerald-600",
    badgeClass: "bg-emerald-100 text-emerald-700",
  },
};

export const NOTIFICATION_TYPES = Object.keys(
  NOTIFICATION_TYPE_META
) as NotificationType[];

export function NotificationPreview({
  type,
  title,
  message,
  link,
}: {
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
}) {
  const meta = NOTIFICATION_TYPE_META[type];
  const Icon = meta.icon;

  return (
    <div className="rounded-xl border bg-card p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
          <Bell className="size-4" />
        </span>
        <span className="text-xs font-medium text-muted-foreground">
          LMS Platform
        </span>
        <span className="ml-auto text-[0.65rem] text-muted-foreground">
          2m ago
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span
          className={cn(
            "inline-flex size-7 items-center justify-center rounded-md",
            meta.iconClass
          )}
        >
          <Icon className="size-4" />
        </span>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-medium",
            meta.badgeClass
          )}
        >
          {meta.label}
        </span>
      </div>
      <p
        className={cn(
          "mt-2 text-sm font-semibold",
          title && "line-clamp-1"
        )}
      >
        {title || "Notification title"}
      </p>
      <p
        className={cn(
          "mt-0.5 text-sm text-muted-foreground",
          message && "line-clamp-2"
        )}
      >
        {message || "Your notification message will appear here."}
      </p>
      {link ? (
        <p className="mt-1 truncate text-xs text-primary underline-offset-2">
          {link}
        </p>
      ) : null}
    </div>
  );
}
import type { BatchSummary, Course, CourseLevel } from "@/types";

export const LEVEL_LABEL: Record<CourseLevel, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

export const LEVEL_BADGE_CLASS: Record<CourseLevel, string> = {
  BEGINNER:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  INTERMEDIATE:
    "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  ADVANCED: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
};

export function formatPrice(price: number): string {
  return price === 0 ? "Free" : `৳${price.toLocaleString("en-US")}`;
}

export function formatDate(value?: string | null): string {
  if (!value) return "TBA";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "TBA";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function daysUntil(value?: string | null): number | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - Date.now()) / 86_400_000);
}

export function timeAgo(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function shortenTx(
  value: string | null | undefined,
  prefix = 6,
  suffix = 4
): string {
  if (!value) return "\u2014";
  if (value.length <= prefix + suffix + 1) return value;
  return `${value.slice(0, prefix)}\u2026${value.slice(-suffix)}`;
}

export type BatchKind = "active" | "upcoming" | "completed" | "none";

export interface BatchPick {
  kind: BatchKind;
  batch: BatchSummary | null;
}

function startTime(batch: BatchSummary): number {
  if (!batch.startDate) return Number.POSITIVE_INFINITY;
  const time = new Date(batch.startDate).getTime();
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
}

export function pickBatch(course: Course): BatchPick {
  const batches = course.batches ?? [];

  const active = batches.find((batch) => batch.status === "ACTIVE");
  if (active) return { kind: "active", batch: active };

  const upcoming = batches
    .filter((batch) => batch.status === "UPCOMING")
    .sort((a, b) => startTime(a) - startTime(b));
  if (upcoming.length > 0) return { kind: "upcoming", batch: upcoming[0] };

  const completed = batches.find((batch) => batch.status === "COMPLETED");
  if (completed) return { kind: "completed", batch: completed };

  return { kind: "none", batch: null };
}

export function batchCountdownText(pick: BatchPick): string {
  const { kind, batch } = pick;
  if (kind === "active") return "Enrolling Now";
  if (kind === "completed") return "Batch completed";
  if (kind === "none") return "No active batch";

  const days = daysUntil(batch?.startDate);
  if (days === null) return "Enrollment open";
  if (days > 0) return `Starts in ${days} day${days === 1 ? "" : "s"}`;
  return "Enrolling Now";
}

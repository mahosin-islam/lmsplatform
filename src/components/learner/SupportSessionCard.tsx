"use client";

import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Radio,
  Video,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "cn";

import type { LiveSession, LiveSessionStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function getSessionStatus(
  session: LiveSession,
  nowMs: number
): LiveSessionStatus {
  const start = new Date(session.scheduledAt).getTime();
  const end = start + session.duration * MINUTE;
  if (nowMs < start) return "UPCOMING";
  if (nowMs <= end) return "LIVE";
  return "ENDED";
}

function formatCountdown(ms: number): string {
  const days = Math.floor(ms / DAY);
  const hours = Math.floor((ms % DAY) / HOUR);
  const minutes = Math.floor((ms % HOUR) / MINUTE);

  if (days > 0) {
    return `${days} day${days === 1 ? "" : "s"}, ${hours} hour${
      hours === 1 ? "" : "s"
    }`;
  }
  if (hours > 0) {
    return `${hours} hour${hours === 1 ? "" : "s"}, ${minutes} minute${
      minutes === 1 ? "" : "s"
    }`;
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  }
  return "less than a minute";
}

export function SupportSessionCard({
  session,
  now,
}: {
  session: LiveSession;
  now: number;
}) {
  const status = getSessionStatus(session, now);

  const startMs = new Date(session.scheduledAt).getTime();
  const endMs = startMs + session.duration * MINUTE;
  const startDate = new Date(session.scheduledAt);

  const courseTitle =
    session.batch?.course?.title ?? session.batch?.title ?? "Support Session";
  const batchLabel = session.batch
    ? `Batch ${session.batch.batchNumber}`
    : null;

  const dateLine = `${format(startDate, "MMM d, yyyy")} · ${format(
    startDate,
    "h:mm a"
  )} · ${session.duration} min`;

  const isLive = status === "LIVE";
  const isUpcoming = status === "UPCOMING";
  const isEnded = status === "ENDED";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border p-5 shadow-sm transition-colors",
        isLive && "border-red-200 bg-gradient-to-br from-red-50 to-rose-50",
        isUpcoming && "border-amber-200 bg-amber-50/40",
        isEnded && "border-slate-200 bg-slate-50"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        {isLive ? (
          <Badge className="gap-1.5 bg-red-600 text-white">
            <span className="relative flex size-2">
              <span className="size-2 animate-pulse rounded-full bg-white" />
            </span>
            Live Now
          </Badge>
        ) : isUpcoming ? (
          <Badge className="gap-1.5 bg-amber-500 text-white">
            <Clock className="size-3" />
            Upcoming
          </Badge>
        ) : (
          <Badge
            variant="secondary"
            className="gap-1.5 bg-slate-200 text-slate-600"
          >
            <CheckCircle2 className="size-3" />
            Ended
          </Badge>
        )}
        {isLive ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-red-600">
            <Radio className="size-3.5" />
            Live now
          </span>
        ) : null}
      </div>

      <div className="space-y-1">
        <p className="flex items-center gap-2 font-semibold">
          <span
            className={cn(
              "inline-flex size-8 shrink-0 items-center justify-center rounded-lg",
              isLive
                ? "bg-red-100 text-red-600"
                : isUpcoming
                  ? "bg-amber-100 text-amber-600"
                  : "bg-slate-200 text-slate-500"
            )}
          >
            <BookOpen className="size-4" />
          </span>
          {session.title}
        </p>
        <p className="pl-10 text-sm text-muted-foreground">
          {courseTitle}
          {batchLabel ? ` · ${batchLabel}` : ""}
        </p>
      </div>

      <p className="flex items-center gap-1.5 pl-10 text-xs text-muted-foreground">
        <Calendar className="size-3.5" />
        {dateLine}
      </p>

      {isUpcoming ? (
        <p className="flex items-center gap-1.5 pl-10 text-sm font-medium text-amber-600">
          <Clock className="size-3.5" />
          Starts in {formatCountdown(Math.max(startMs - now, 0))}
        </p>
      ) : isEnded ? (
        <p className="flex items-center gap-1.5 pl-10 text-sm text-slate-500">
          <CheckCircle2 className="size-3.5" />
          This session has ended
        </p>
      ) : null}

      {isEnded ? (
        <div className="pl-10">
          <Button
            variant="outline"
            disabled
            className="w-full cursor-not-allowed bg-slate-100 text-muted-foreground"
          >
            <Video className="size-4" />
            Join Meeting
          </Button>
        </div>
      ) : isUpcoming ? (
        <div className="pl-10">
          <Button
            variant="outline"
            disabled
            title={`Available at ${format(startDate, "MMM d, yyyy 'at' h:mm a")}`}
            className="w-full border-amber-300 bg-white text-amber-700 opacity-100"
          >
            <Video className="size-4" />
            Join Meeting
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            Meeting link will be active at start time
          </p>
        </div>
      ) : (
        <div className="pl-10">
          <a
            href={session.meetingLink}
            target="_blank"
            rel="noreferrer"
            className="block w-full"
          >
            <Button className="w-full bg-emerald-600 text-white hover:bg-emerald-500">
              <ExternalLink className="size-4" />
              Join Meeting
            </Button>
          </a>
          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600">
            <Clock className="size-3.5" />
            Session ends in {formatCountdown(Math.max(endMs - now, 0))}
          </p>
        </div>
      )}
    </div>
  );
}
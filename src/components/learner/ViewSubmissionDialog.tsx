"use client";

import { format } from "date-fns";
import { CalendarClock, ExternalLink, FileText, MessageSquareText } from "lucide-react";

import {
  gradeLetter,
  scoreBadgeClass,
} from "@/lib/assignment-utils";
import type { AssignmentSubmission } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

export function ViewSubmissionDialog({
  open,
  onOpenChange,
  submission,
  courseTitle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: AssignmentSubmission | null;
  courseTitle?: string;
}) {
  if (!submission) return null;

  const assignment = submission.assignment;
  const totalMarks = assignment?.totalMarks ?? 0;
  const percent =
    submission.status === "GRADED" && submission.marks != null && totalMarks > 0
      ? Math.round((submission.marks / totalMarks) * 100)
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{assignment?.title ?? "Submission"}</DialogTitle>
          <DialogDescription>
            {courseTitle ? courseTitle : "Assignment submission"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Submitted {format(new Date(submission.submittedAt), "MMM d, yyyy 'at' h:mm a")}
            </p>
            <a
              href={submission.answerUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:underline"
            >
              <ExternalLink className="size-4" />
              Open Submission
            </a>
          </div>

          {submission.note ? (
            <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
              <MessageSquareText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{submission.note}</p>
            </div>
          ) : null}

          <Separator />

          {submission.status === "GRADED" ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-lg font-bold tabular-nums ${scoreBadgeClass(percent ?? 0)}`}
                >
                  {submission.marks} / {totalMarks} marks
                </span>
                {percent != null ? (
                  <Badge variant="secondary">
                    {percent}% · Grade {gradeLetter(percent)}
                  </Badge>
                ) : null}
              </div>

              {submission.feedback ? (
                <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
                  <p className="text-xs font-semibold text-emerald-700">
                    Instructor Feedback
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {submission.feedback}
                  </p>
                </div>
              ) : (
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <FileText className="size-4" />
                  No feedback provided.
                </p>
              )}

              {submission.gradedAt ? (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarClock className="size-3.5" />
                  Graded {format(new Date(submission.gradedAt), "MMM d, yyyy 'at' h:mm a")}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
              <span className="inline-flex size-2 animate-pulse rounded-full bg-amber-500" />
              Waiting for grade
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
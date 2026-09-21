"use client";

import { formatDistanceToNow } from "date-fns";
import {
  Award,
  ExternalLink,
  FileCheck2,
  MessageSquareText,
  Search,
} from "lucide-react";

import type { AssignmentSubmission } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function SubmissionViewDialog({
  open,
  onOpenChange,
  submission,
  totalMarks,
  onGrade,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: AssignmentSubmission | null;
  totalMarks?: number;
  onGrade?: (submission: AssignmentSubmission) => void;
}) {
  const learner = submission?.learner;
  const effectiveTotal =
    totalMarks ??
    submission?.assignment?.totalMarks ??
    submission?.marks ??
    0;
  const isGraded = submission?.status === "GRADED";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Submission Details</DialogTitle>
          <DialogDescription>
            Review what the student uploaded before grading.
          </DialogDescription>
        </DialogHeader>

        {submission ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <Avatar className="size-10">
                {learner?.avatar ? (
                  <AvatarImage src={learner.avatar} alt={learner.name} />
                ) : null}
                <AvatarFallback>
                  {initials(learner?.name ?? "?")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {learner?.name ?? "Unknown student"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {learner?.email ?? ""}
                </p>
              </div>
              <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(submission.submittedAt), {
                  addSuffix: true,
                })}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <a
                href={submission.answerUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium text-primary hover:bg-muted/40"
              >
                <FileCheck2 className="size-4" />
                View answer
              </a>
              {onGrade && !isGraded ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    onGrade(submission);
                    onOpenChange(false);
                  }}
                >
                  <Search className="size-4" />
                  Grade this
                </Button>
              ) : (
                <a
                  href={submission.answerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium text-muted-foreground hover:bg-muted/40"
                >
                  <ExternalLink className="size-4" />
                  Open link
                </a>
              )}
            </div>

            {submission.note ? (
              <div className="rounded-lg border p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Student&apos;s note
                </p>
                <p className="mt-1 text-sm">{submission.note}</p>
              </div>
            ) : null}

            {isGraded ? (
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold">
                      {submission.marks}
                    </span>
                    <span className="pb-1 text-sm text-muted-foreground">
                      / {effectiveTotal}
                    </span>
                  </div>
                  <Badge className="ml-auto bg-emerald-100 text-emerald-700">
                    <Award className="mr-1 size-3.5" />
                    Graded
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Graded{" "}
                  {submission.gradedAt
                    ? formatDistanceToNow(new Date(submission.gradedAt), {
                        addSuffix: true,
                      })
                    : "recently"}
                </p>
                {submission.feedback ? (
                  <div className="mt-3 flex gap-2 rounded-lg bg-muted/50 p-3 text-sm">
                    <MessageSquareText className="size-4 shrink-0 text-muted-foreground" />
                    <span>{submission.feedback}</span>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-4 text-center">
                <Award className="mx-auto size-6 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">Not graded yet</p>
                <p className="text-xs text-muted-foreground">
                  Grade this submission to share marks and feedback.
                </p>
              </div>
            )}
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
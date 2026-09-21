"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { ExternalLink, Loader2, Percent } from "lucide-react";

import { apiFetch } from "@/lib/api";
import type { AssignmentSubmission } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function GradeSubmissionDialog({
  open,
  onOpenChange,
  submission,
  totalMarks,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: AssignmentSubmission | null;
  totalMarks: number;
  onSuccess?: () => void;
}) {
  const [marksInput, setMarksInput] = useState("");
  const [feedback, setFeedback] = useState("");
  const [errors, setErrors] = useState<{ marks?: string; feedback?: string }>({});

  useEffect(() => {
    if (open) {
      setMarksInput(
        submission?.marks != null ? String(submission.marks) : ""
      );
      setFeedback(submission?.feedback ?? "");
      setErrors({});
    }
  }, [open, submission]);

  const mutation = useMutation({
    mutationFn: async (values: { marks: number; feedback: string }) =>
      apiFetch(`/assignments/submissions/${submission?.id ?? ""}/grade`, {
        method: "PATCH",
        body: { marks: values.marks, feedback: values.feedback || null },
      }),
    onSuccess: () => {
      toast.success("Grade saved");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not save grade"
      );
    },
  });

  const quickMark = (percent: number) =>
    Math.round((totalMarks * percent) / 100);

  const submit = () => {
    if (!submission) return;
    const marks = Number(marksInput);
    if (
      marksInput.trim() === "" ||
      !Number.isFinite(marks) ||
      Number.isNaN(marks)
    ) {
      setErrors({ marks: "Enter a numeric mark" });
      toast.error("Enter a numeric mark");
      return;
    }
    if (marks < 0 || marks > totalMarks) {
      setErrors({ marks: `Marks must be between 0 and ${totalMarks}` });
      toast.error(`Marks must be between 0 and ${totalMarks}`);
      return;
    }
    if (feedback.trim().length > 500) {
      setErrors({ feedback: "Keep feedback under 500 characters" });
      toast.error("Keep feedback under 500 characters");
      return;
    }
    mutation.mutate({ marks, feedback: feedback.trim() });
  };

  const learner = submission?.learner;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Grade Submission</DialogTitle>
          <DialogDescription>
            Award marks and leave optional feedback for the student.
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

            <a
              href={submission.answerUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium text-primary hover:bg-muted/40"
            >
              <ExternalLink className="size-4" />
              Open submitted answer
            </a>

            <div>
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="g-marks">Marks</Label>
                  <Input
                    id="g-marks"
                    type="number"
                    min={0}
                    max={totalMarks}
                    value={marksInput}
                    onChange={(event) => setMarksInput(event.target.value)}
                  />
                </div>
                <span className="pb-2 text-sm text-muted-foreground">
                  / {totalMarks}
                </span>
              </div>
              {errors.marks ? (
                <p className="mt-1 text-xs text-destructive">{errors.marks}</p>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Percent className="mr-1 size-3.5 text-muted-foreground" />
                {[100, 75, 50, 0].map((percent) => (
                  <Button
                    key={percent}
                    variant="outline"
                    size="sm"
                    onClick={() => setMarksInput(String(quickMark(percent)))}
                  >
                    {percent}%
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="g-feedback">Feedback (optional)</Label>
              <Textarea
                id="g-feedback"
                rows={3}
                maxLength={500}
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                placeholder="Well done! Watch out for rounding in question 2."
              />
              <p className="text-right text-xs text-muted-foreground">
                {feedback.length}/500
              </p>
              {errors.feedback ? (
                <p className="text-xs text-destructive">{errors.feedback}</p>
              ) : null}
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button onClick={submit} disabled={mutation.isPending}>
            {mutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Percent className="size-4" />
            )}
            Save Grade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
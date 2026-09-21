"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { CalendarClock, ExternalLink, Loader2, Upload } from "lucide-react";
import { z } from "zod";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { getDeadlineStatus } from "@/lib/assignment-utils";
import type { Assignment, AssignmentSubmission } from "@/types";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

const submitSchema = z.object({
  answerUrl: z
    .string()
    .min(1, "Answer URL is required")
    .url("Enter a valid URL"),
  note: z.string().max(1000, "Keep your note under 1000 characters"),
});

type SubmitFormValues = z.infer<typeof submitSchema>;

export interface EnrichedAssignment extends Assignment {
  courseTitle?: string;
  batchTitle?: string | null;
}

export function SubmitAssignmentDialog({
  open,
  onOpenChange,
  assignment,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: EnrichedAssignment | null;
  onSuccess?: () => void;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubmitFormValues>({
    resolver: zodResolver(submitSchema),
    defaultValues: { answerUrl: "", note: "" },
  });

  useEffect(() => {
    if (open) reset({ answerUrl: "", note: "" });
  }, [open, reset]);

  const submitMutation = useMutation({
    mutationFn: async (values: SubmitFormValues) => {
      if (!user?.id || !assignment) throw new Error("Missing user or assignment");
      const res = await apiFetch<AssignmentSubmission>(
        `/assignments/${assignment.id}/submit`,
        {
          method: "POST",
          body: {
            learnerId: user.id,
            answerUrl: values.answerUrl,
            note: values.note.trim() || null,
          },
        }
      );
      if (!res.data) throw new Error("Could not submit the assignment");
      return res.data;
    },
    onSuccess: () => {
      toast.success("Assignment submitted!");
      queryClient.invalidateQueries({
        queryKey: ["my-submissions", user?.id],
      });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not submit assignment"
      );
    },
  });

  if (!assignment) return null;

  const deadlineStatus = getDeadlineStatus(assignment.deadline);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit Assignment</DialogTitle>
          <DialogDescription>
            {assignment.courseTitle ? `${assignment.courseTitle} · ` : ""}
            {assignment.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {assignment.description || "No description provided."}
            </p>
            {assignment.docUrl ? (
              <a
                href={assignment.docUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline"
              >
                Open instructions
                <ExternalLink className="size-3.5" />
              </a>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className={deadlineStatus.color === "red" ? "bg-red-100 text-red-700" : undefined}
            >
              <CalendarClock className="size-3" />
              {deadlineStatus.label}
            </Badge>
            <Badge variant="secondary">Total: {assignment.totalMarks} marks</Badge>
          </div>
          {assignment.deadline ? (
            <p className="text-xs text-muted-foreground">
              Submit by{" "}
              {format(new Date(assignment.deadline), "MMM d, yyyy 'at' h:mm a")}
            </p>
          ) : null}

          <Separator />

          <form
            onSubmit={handleSubmit((values) => submitMutation.mutate(values))}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="answerUrl">Answer URL</Label>
              <Input
                id="answerUrl"
                type="url"
                placeholder="https://docs.google.com/document/d/xxx"
                aria-invalid={Boolean(errors.answerUrl)}
                {...register("answerUrl")}
              />
              <p className="text-xs text-muted-foreground">
                Paste a link to your Google Doc, GitHub repo, or any public URL
              </p>
              {errors.answerUrl ? (
                <p className="text-xs text-destructive">
                  {errors.answerUrl.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Textarea
                id="note"
                rows={3}
                placeholder="Any message for the instructor..."
                {...register("note")}
              />
              {errors.note ? (
                <p className="text-xs text-destructive">
                  {errors.note.message}
                </p>
              ) : null}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitMutation.isPending}>
                {submitMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                Submit Assignment
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
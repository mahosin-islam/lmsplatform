"use client";

import * as React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { Loader2, Video } from "lucide-react";
import { z } from "zod";

import { apiFetch } from "@/lib/api";
import type {
  Batch,
  BatchListData,
  Course,
  CourseListData,
  LiveSession,
} from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

const liveSessionSchema = z.object({
  courseId: z.string().min(1, "Course is required"),
  batchId: z.string().min(1, "Batch is required"),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be 100 characters or fewer"),
  description: z.string().max(500, "Keep the description under 500 characters"),
  meetingLink: z.string().url("Enter a valid meeting link (https://...)"),
  scheduledAt: z.string().min(1, "Schedule date and time are required"),
  duration: z.number().min(15, "Minimum 15 minutes").max(480, "Maximum 480 minutes"),
});

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} minutes`;
  if (rest === 0) return `${hours} hour${hours === 1 ? "" : "s"}`;
  return `${hours} hour${hours === 1 ? "" : "s"} ${rest} minutes`;
}

export function LiveSessionFormDialog({
  open,
  onOpenChange,
  existing,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing?: (LiveSession & { courseId?: string }) | null;
  onSuccess?: () => void;
}) {
  const [courseId, setCourseId] = React.useState("");
  const [batchId, setBatchId] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [meetingLink, setMeetingLink] = React.useState("");
  const [date, setDate] = React.useState("");
  const [time, setTime] = React.useState("");
  const [duration, setDuration] = React.useState(60);
  const [notify, setNotify] = React.useState(true);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const isEdit = Boolean(existing);

  const coursesQuery = useQuery({
    queryKey: ["courses", "batch"],
    queryFn: async () =>
      (
        await apiFetch<CourseListData>("/courses?courseType=BATCH")
      ).data,
  });

  const batchesQuery = useQuery({
    queryKey: ["batches", "all", courseId],
    enabled: Boolean(courseId),
    queryFn: async () =>
      (
        await apiFetch<BatchListData>(`/batches/course/${courseId}`)
      ).data,
  });

  const courses = coursesQuery.data?.courses ?? [];
  const batches = batchesQuery.data?.batches ?? [];

  React.useEffect(() => {
    if (open) {
      if (existing) {
        const start = existing.scheduledAt
          ? new Date(existing.scheduledAt)
          : null;
        setCourseId(existing.courseId ?? "");
        setBatchId(existing.batchId);
        setTitle(existing.title);
        setDescription(existing.description ?? "");
        setMeetingLink(existing.meetingLink);
        setDate(start && !Number.isNaN(start.getTime()) ? format(start, "yyyy-MM-dd") : "");
        setTime(start && !Number.isNaN(start.getTime()) ? format(start, "HH:mm") : "");
        setDuration(existing.duration);
      } else {
        setCourseId("");
        setBatchId("");
        setTitle("");
        setDescription("");
        setMeetingLink("");
        setDate("");
        setTime("");
        setDuration(60);
        setNotify(true);
      }
      setErrors({});
    }
  }, [open, existing]);

  const mutation = useMutation({
    mutationFn: async (values: {
      courseId: string;
      batchId: string;
      title: string;
      description?: string;
      meetingLink: string;
      scheduledAt: string;
      duration: number;
      notifyStudents: boolean;
    }) => {
      if (existing) {
        return apiFetch(`/live-sessions/${existing.id}`, {
          method: "PATCH",
          body: {
            title: values.title,
            description: values.description || null,
            meetingLink: values.meetingLink,
            scheduledAt: values.scheduledAt,
            duration: values.duration,
          },
        });
      }
      return apiFetch("/live-sessions", {
        method: "POST",
        body: {
          batchId: values.batchId,
          title: values.title,
          description: values.description || null,
          meetingLink: values.meetingLink,
          scheduledAt: values.scheduledAt,
          duration: values.duration,
          notifyStudents: values.notifyStudents,
        },
      });
    },
    onSuccess: () => {
      toast.success(
        existing
          ? "Live session updated"
          : notify
            ? "Live class scheduled and students notified"
            : "Live class scheduled"
      );
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not save live session"
      );
    },
  });

  const scheduledAt = React.useMemo(() => {
    if (!date || !time) return "";
    const parsed = new Date(`${date}T${time}`);
    return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
  }, [date, time]);

  const submit = () => {
    const values = {
      courseId,
      batchId,
      title: title.trim(),
      description: description.trim(),
      meetingLink: meetingLink.trim(),
      scheduledAt,
      duration,
      notifyStudents: notify,
    };
    const parsed = liveSessionSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const nextErrors: Record<string, string> = {};
      Object.entries(fieldErrors).forEach(([key, messages]) => {
        if (messages && messages.length > 0) nextErrors[key] = messages[0];
      });
      setErrors(nextErrors);
      const first = Object.values(nextErrors)[0];
      if (first) toast.error(first);
      return;
    }
    if (!isEdit && new Date(scheduledAt).getTime() <= Date.now()) {
      setErrors((prev) => ({
        ...prev,
        scheduledAt: "Schedule the class in the future",
      }));
      toast.error("Schedule the class in the future");
      return;
    }
    mutation.mutate(values);
  };

  const selectedBatch = batches.find((batch: Batch) => batch.id === batchId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Live Class" : "Schedule Live Class"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details of this live class."
              : "Schedule a live class for the students of a batch."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ls-course">Course</Label>
              <Select
                value={courseId}
                onValueChange={(value) => {
                  setCourseId(value ?? "");
                  setBatchId("");
                }}
                disabled={isEdit}
              >
                <SelectTrigger id="ls-course" className="w-full">
                  <SelectValue>
                    {(current: string) =>
                      (courses.find((course: Course) => course.id === current)
                        ?.title) || "Select a course"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course: Course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.courseId ? (
                <p className="text-xs text-destructive">{errors.courseId}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ls-batch">Batch</Label>
              {!courseId && !isEdit ? (
                <div className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
                  Select a course first
                </div>
              ) : batchesQuery.isLoading ? (
                <Skeleton className="h-8 w-full" />
              ) : batches.length === 0 ? (
                <div className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
                  No batches for this course
                </div>
              ) : (
                <Select
                  value={batchId}
                  onValueChange={(value) => setBatchId(value ?? "")}
                  disabled={isEdit}
                >
                  <SelectTrigger id="ls-batch" className="w-full">
                    <SelectValue>
                      {(current: string) =>
                        (batches.find((batch: Batch) => batch.id === current)
                          ?.title ??
                          `Batch ${
                            batches.find((batch: Batch) => batch.id === current)
                              ?.batchNumber ?? ""
                          }`) || "Select a batch"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map((batch: Batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.title ?? `Batch ${batch.batchNumber}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.batchId ? (
                <p className="text-xs text-destructive">{errors.batchId}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ls-title">Title</Label>
            <Input
              id="ls-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Spoken English Practice"
              maxLength={100}
            />
            {errors.title ? (
              <p className="text-xs text-destructive">{errors.title}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ls-description">Description (optional)</Label>
            <Textarea
              id="ls-description"
              rows={2}
              maxLength={500}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What will this class cover?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ls-link">Meeting Link</Label>
            <Input
              id="ls-link"
              value={meetingLink}
              onChange={(event) => setMeetingLink(event.target.value)}
              placeholder="https://meet.google.com/abc-def-ghi"
              type="url"
            />
            <p className="text-xs text-muted-foreground">
              Supports Google Meet, Zoom, and Microsoft Teams links.
            </p>
            {errors.meetingLink ? (
              <p className="text-xs text-destructive">
                {errors.meetingLink}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ls-date">Date</Label>
              <Input
                id="ls-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ls-time">Time</Label>
              <Input
                id="ls-time"
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
              />
            </div>
          </div>
          {errors.scheduledAt ? (
            <p className="text-xs text-destructive">{errors.scheduledAt}</p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="ls-duration">Duration (minutes)</Label>
            <Input
              id="ls-duration"
              type="number"
              min={15}
              max={480}
              value={duration}
              onChange={(event) =>
                setDuration(Math.max(0, Number(event.target.value)))
              }
            />
            <p className="text-xs text-muted-foreground">
              {formatDuration(duration)} · 15 to 480 minutes
            </p>
            {errors.duration ? (
              <p className="text-xs text-destructive">{errors.duration}</p>
            ) : null}
          </div>

          {!isEdit ? (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={notify}
                onCheckedChange={setNotify}
                id="ls-notify"
              />
              <Label htmlFor="ls-notify" className="normal-case">
                Notify enrolled students
              </Label>
            </div>
          ) : null}

          {isEdit && selectedBatch ? (
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-sm">
              <Video className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">
                Editing for {selectedBatch.title ?? `Batch ${selectedBatch.batchNumber}`}
              </span>
              {!date || !time ? null : (
                <Badge variant="secondary" className="ml-auto shrink-0">
                  {format(new Date(`${date}T${time}`), "MMM d, h:mm a")}
                </Badge>
              )}
            </div>
          ) : null}
        </div>

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
              <Video className="size-4" />
            )}
            {isEdit ? "Save Changes" : "Schedule Class"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
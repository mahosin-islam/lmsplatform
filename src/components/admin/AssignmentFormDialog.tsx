"use client";

import { useEffect, useState, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { ClipboardList, Info, Loader2 } from "lucide-react";
import { z } from "zod";

import { apiFetch } from "@/lib/api";
import type {
  Assignment,
  Batch,
  BatchListData,
  Course,
  CourseListData,
  Module,
  ModuleListData,
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

const assignmentBaseSchema = z.object({
  courseId: z.string().min(1, "Course is required"),
  batchId: z.string().optional(),
  moduleId: z.string().min(1, "Module is required"),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Title must be 120 characters or fewer"),
  description: z.string().max(1000, "Keep the description under 1000 characters"),
  docUrl: z.union([z.string().url("Enter a valid document link"), z.literal("")]),
  deadline: z.string(),
  totalMarks: z
    .number()
    .int("Use whole numbers")
    .min(1, "At least 1 mark")
    .max(1000, "Maximum 1000 marks"),
});

function assignmentSchemaFor(courses: Course[], isEdit: boolean) {
  return assignmentBaseSchema.superRefine((data, ctx) => {
    if (isEdit) return;
    const course = courses.find((item) => item.id === data.courseId);
    if (course?.courseType === "BATCH" && !data.batchId) {
      ctx.addIssue({
        code: "custom",
        message: "Batch is required for BATCH courses",
        path: ["batchId"],
      });
    }
  });
}

function moduleLabel(modules: Module[], id: string): string {
  const mod = modules.find((item) => item.id === id);
  return mod?.title ?? "";
}

function batchOptionLabel(batches: Batch[], id: string): string {
  const batch = batches.find((item) => item.id === id);
  if (!batch) return "Select a batch";
  const title = batch.title ? `: ${batch.title}` : "";
  return `Batch ${batch.batchNumber}${title} · ${batch.status}`;
}

const BATCH_STATUS_CLASS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  UPCOMING: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-slate-100 text-slate-500",
};

export function AssignmentFormDialog({
  open,
  onOpenChange,
  existing,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing?: (Assignment & { courseId?: string }) | null;
  onSuccess?: () => void;
}) {
  const [courseId, setCourseId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("");
  const [totalMarks, setTotalMarks] = useState("100");
  const [notify, setNotify] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = Boolean(existing);

  const coursesQuery = useQuery({
    queryKey: ["courses"],
    queryFn: async () => (await apiFetch<CourseListData>("/courses")).data,
  });
  const courses = coursesQuery.data?.courses ?? [];

  const selectedCourse = courses.find((course: Course) => course.id === courseId);
  const isBatchCourse = selectedCourse?.courseType === "BATCH";

  const batchesQuery = useQuery({
    queryKey: ["batches", "for-assignment", courseId],
    enabled: Boolean(courseId) && Boolean(isBatchCourse),
    queryFn: async () =>
      (await apiFetch<BatchListData>(`/batches/course/${courseId}`)).data,
  });
  const batches = (batchesQuery.data?.batches ?? [])
    .slice()
    .sort((a, b) => a.batchNumber - b.batchNumber);

  const selectedBatch = batches.find((batch: Batch) => batch.id === batchId);

  const modulesQuery = useQuery({
    queryKey: isEdit
      ? ["modules", "for-assignment-edit", courseId]
      : ["modules", "for-assignment", courseId, batchId],
    enabled: Boolean(courseId) && (!isBatchCourse || isEdit || Boolean(batchId)),
    queryFn: async () => {
      const qs =
        isBatchCourse && batchId && !isEdit ? `?batchId=${batchId}` : "";
      return (await apiFetch<ModuleListData>(`/modules/course/${courseId}${qs}`))
        .data;
    },
  });
  const modules = useMemo(
    () => modulesQuery.data?.modules ?? [],
    [modulesQuery.data]
  );

  useEffect(() => {
    if (open) {
      if (existing) {
        setCourseId(existing.courseId ?? "");
        setBatchId("");
        setModuleId(existing.moduleId);
        setTitle(existing.title);
        setDescription(existing.description ?? "");
        setDocUrl(existing.docUrl ?? "");
        const deadline = existing.deadline ? new Date(existing.deadline) : null;
        setDeadlineDate(
          deadline && !Number.isNaN(deadline.getTime())
            ? format(deadline, "yyyy-MM-dd")
            : ""
        );
        setDeadlineTime(
          deadline && !Number.isNaN(deadline.getTime())
            ? format(deadline, "HH:mm")
            : ""
        );
        setTotalMarks(String(existing.totalMarks));
      } else {
        setCourseId("");
        setBatchId("");
        setModuleId("");
        setTitle("");
        setDescription("");
        setDocUrl("");
        setDeadlineDate("");
        setDeadlineTime("");
        setTotalMarks("100");
        setNotify(true);
      }
      setErrors({});
    }
  }, [open, existing]);

  useEffect(() => {
    if (isEdit && existing && !batchId && modules.length > 0) {
      const mod = modules.find((item) => item.id === existing.moduleId);
      if (mod?.batchId) setBatchId(mod.batchId);
    }
  }, [isEdit, existing, batchId, modules]);

  const mutation = useMutation({
    mutationFn: async (values: {
      moduleId: string;
      title: string;
      description: string;
      docUrl: string;
      deadline: string;
      totalMarks: number;
      notifyStudents: boolean;
    }) => {
      if (existing) {
        return apiFetch(`/assignments/${existing.id}`, {
          method: "PATCH",
          body: {
            title: values.title,
            description: values.description || null,
            docUrl: values.docUrl || null,
            deadline: values.deadline || null,
            totalMarks: values.totalMarks,
          },
        });
      }
      return apiFetch("/assignments", {
        method: "POST",
        body: {
          moduleId: values.moduleId,
          title: values.title,
          description: values.description || null,
          docUrl: values.docUrl || null,
          deadline: values.deadline || null,
          totalMarks: values.totalMarks,
          notifyStudents: values.notifyStudents,
        },
      });
    },
    onSuccess: () => {
      toast.success(
        existing
          ? "Assignment updated"
          : notify
            ? "Assignment created and students notified"
            : "Assignment created"
      );
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not save assignment"
      );
    },
  });

  const deadlineISO = (() => {
    if (!deadlineDate && !deadlineTime) return "";
    if (!deadlineDate || !deadlineTime) return null;
    const parsed = new Date(`${deadlineDate}T${deadlineTime}`);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toISOString();
  })();

  const submit = () => {
    if (deadlineISO === null) {
      setErrors((prev) => ({
        ...prev,
        deadline: "Set both a date and a time, or leave both empty.",
      }));
      toast.error("Set both a date and a time, or leave both empty.");
      return;
    }

    const values = {
      courseId,
      batchId,
      moduleId,
      title: title.trim(),
      description: description.trim(),
      docUrl: docUrl.trim(),
      deadline: deadlineISO,
      totalMarks: Number(totalMarks),
      notifyStudents: notify,
    };
    const parsed = assignmentSchemaFor(courses, isEdit).safeParse(values);
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
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Assignment" : "Create Assignment"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details of this assignment."
              : "Create an assignment for the learners of a module."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="as-course">Course</Label>
              <Select
                value={courseId}
                onValueChange={(value) => {
                  setCourseId(value ?? "");
                  setBatchId("");
                  setModuleId("");
                }}
                disabled={isEdit}
              >
                <SelectTrigger id="as-course" className="w-full">
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
              <Label htmlFor="as-module">Module</Label>
              {!courseId ? (
                <div className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
                  Select a course first
                </div>
              ) : isBatchCourse && !isEdit && !batchId ? (
                <div className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
                  Select a batch first
                </div>
              ) : modulesQuery.isLoading ? (
                <Skeleton className="h-8 w-full" />
              ) : modules.length === 0 ? (
                <div className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
                  No modules for this course
                </div>
              ) : (
                <Select
                  value={moduleId}
                  onValueChange={(value) => setModuleId(value ?? "")}
                  disabled={isEdit}
                >
                  <SelectTrigger id="as-module" className="w-full">
                    <SelectValue>
                      {(current: string) =>
                        moduleLabel(modules, current) || "Select a module"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {modules.map((module: Module) => (
                      <SelectItem key={module.id} value={module.id}>
                        {moduleLabel(modules, module.id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.moduleId ? (
                <p className="text-xs text-destructive">{errors.moduleId}</p>
              ) : null}
            </div>
          </div>

          {isBatchCourse ? (
            <div className="space-y-2">
              <Label htmlFor="as-batch">Batch</Label>
              {batchesQuery.isLoading ? (
                <Skeleton className="h-8 w-full" />
              ) : batches.length === 0 ? (
                <div className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
                  No batches for this course
                </div>
              ) : (
                <Select
                  value={batchId}
                  onValueChange={(value) => {
                    setBatchId(value ?? "");
                    setModuleId("");
                  }}
                  disabled={isEdit}
                >
                  <SelectTrigger id="as-batch" className="w-full">
                    <SelectValue>
                      {(current: string) =>
                        batchOptionLabel(batches, current)
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map((batch: Batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        <span className="flex items-center gap-2">
                          <span>
                            Batch {batch.batchNumber}
                            {batch.title ? `: ${batch.title}` : ""}
                          </span>
                          <Badge
                            variant="secondary"
                            className={
                              BATCH_STATUS_CLASS[batch.status] ??
                              "bg-slate-100 text-slate-500"
                            }
                          >
                            {batch.status}
                          </Badge>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Info className="size-3.5 shrink-0" />
                Assignments will be sent only to students enrolled in this
                batch.
              </p>
              {errors.batchId ? (
                <p className="text-xs text-destructive">{errors.batchId}</p>
              ) : null}
            </div>
          ) : null}

          {isEdit ? (
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-sm">
              <ClipboardList className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">
                Editing for {moduleLabel(modules, moduleId) || "module"}
                {isBatchCourse && selectedBatch
                  ? ` · Batch ${selectedBatch.batchNumber}`
                  : ""}
              </span>
              {selectedCourse ? (
                <Badge variant="secondary" className="ml-auto shrink-0">
                  {selectedCourse.title}
                </Badge>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="as-title">Title</Label>
            <Input
              id="as-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Practice Worksheet — Unit 3"
              maxLength={120}
            />
            {errors.title ? (
              <p className="text-xs text-destructive">{errors.title}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="as-description">Description (optional)</Label>
            <Textarea
              id="as-description"
              rows={2}
              maxLength={1000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Instructions for learners..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="as-doc">Document Link (optional)</Label>
            <Input
              id="as-doc"
              value={docUrl}
              onChange={(event) => setDocUrl(event.target.value)}
              placeholder="https://drive.google.com/..."
              type="url"
            />
            {errors.docUrl ? (
              <p className="text-xs text-destructive">{errors.docUrl}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="as-duedate">Deadline date</Label>
              <Input
                id="as-duedate"
                type="date"
                value={deadlineDate}
                onChange={(event) => setDeadlineDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="as-duetime">Deadline time</Label>
              <Input
                id="as-duetime"
                type="time"
                value={deadlineTime}
                onChange={(event) => setDeadlineTime(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="as-marks">Total marks</Label>
              <Input
                id="as-marks"
                type="number"
                min={1}
                max={1000}
                value={totalMarks}
                onChange={(event) => setTotalMarks(event.target.value)}
              />
            </div>
          </div>
          {errors.deadline ? (
            <p className="text-xs text-destructive">{errors.deadline}</p>
          ) : null}
          {errors.totalMarks ? (
            <p className="text-xs text-destructive">{errors.totalMarks}</p>
          ) : null}

          {!isEdit ? (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={notify}
                onCheckedChange={setNotify}
                id="as-notify"
              />
              <Label htmlFor="as-notify" className="normal-case">
                Notify enrolled students
              </Label>
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
              <ClipboardList className="size-4" />
            )}
            {isEdit ? "Save Changes" : "Create Assignment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
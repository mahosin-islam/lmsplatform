"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  ClipboardList,
  FileText,
  Hourglass,
  Link as LinkIcon,
  Loader2,
  Pencil,
  Plus,
  Timer,
  Trash2,
} from "lucide-react";
import Link from "next/link";

import { apiFetch } from "@/lib/api";
import type {
  Assignment,
  AssignmentListData,
  AssignmentSubmissionListData,
  Batch,
  BatchListData,
  Course,
  CourseListData,
  ModuleListData,
} from "@/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AssignmentFormDialog } from "@/components/admin/AssignmentFormDialog";

type CombinedAssignment = Assignment & {
  moduleTitle: string;
  moduleOrder: number;
  courseId: string;
  courseTitle: string;
  submissionsCount: number;
  gradedCount: number;
};

function moduleLabel(modules: { id: string; title: string; batchId: string | null }[], id: string): string {
  const mod = modules.find((item) => item.id === id);
  if (!mod) return "";
  return mod.batchId ? `${mod.title} (Batch)` : mod.title;
}

export default function AssignmentsPage() {
  const queryClient = useQueryClient();
  const [courseId, setCourseId] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editAssignment, setEditAssignment] = useState<CombinedAssignment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CombinedAssignment | null>(null);

  const coursesQuery = useQuery({
    queryKey: ["courses"],
    queryFn: async () => (await apiFetch<CourseListData>("/courses")).data,
  });
  const courses = useMemo(
    () => coursesQuery.data?.courses ?? [],
    [coursesQuery.data]
  );

  const modulesQuery = useQuery({
    queryKey: ["modules", "course", courseId],
    enabled: Boolean(courseId),
    queryFn: async () =>
      (await apiFetch<ModuleListData>(`/modules/course/${courseId}`)).data,
  });
  const modules = modulesQuery.data?.modules ?? [];

  const batchesQuery = useQuery({
    queryKey: ["batches", "course", courseId],
    enabled: Boolean(courseId),
    queryFn: async () =>
      (await apiFetch<BatchListData>(`/batches/course/${courseId}`)).data,
  });

  const batchMap = useMemo(() => {
    const map = new Map<string, Batch>();
    for (const batch of batchesQuery.data?.batches ?? []) {
      map.set(batch.id, batch);
    }
    return map;
  }, [batchesQuery.data]);

  useEffect(() => {
    if (courseId === "" && courses.length > 0) {
      setCourseId(courses[0].id);
    }
  }, [courses, courseId]);

  const assignmentsQuery = useQuery({
    queryKey: ["assignments", { courseId }],
    enabled: Boolean(courseId) && modulesQuery.isSuccess,
    queryFn: async (): Promise<CombinedAssignment[]> => {
      const course =
        queryClient.getQueryData<CourseListData>(["courses"])?.courses.find(
          (item: Course) => item.id === courseId
        ) ?? null;
      const mods =
        queryClient.getQueryData<ModuleListData>(["modules", "course", courseId])
          ?.modules ?? [];

      const perModule = await Promise.all(
        mods.map(async (mod) => {
          const res = await apiFetch<AssignmentListData>(
            `/assignments/module/${mod.id}`
          );
          return (res.data?.assignments ?? []).map((assignment) => ({
            ...assignment,
            moduleTitle: mod.title,
            moduleOrder: mod.order,
          }));
        })
      );

      const flat = perModule.flat();

      const detailed = await Promise.all(
        flat.map(async (assignment) => {
          const subs =
            (
              await apiFetch<AssignmentSubmissionListData>(
                `/assignments/${assignment.id}/submissions`
              )
            ).data?.submissions ?? [];
          const gradedCount = subs.filter(
            (submission) => submission.status === "GRADED"
          ).length;
          return {
            ...assignment,
            courseId,
            courseTitle: course?.title ?? "",
            submissionsCount: subs.length,
            gradedCount,
          } as CombinedAssignment;
        })
      );

      detailed.sort((a, b) => {
        const aTime = a.deadline ? new Date(a.deadline).getTime() : Number.POSITIVE_INFINITY;
        const bTime = b.deadline ? new Date(b.deadline).getTime() : Number.POSITIVE_INFINITY;
        if (aTime !== bTime) return aTime - bTime;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

      return detailed;
    },
  });

  const assignments = useMemo(
    () => assignmentsQuery.data ?? [],
    [assignmentsQuery.data]
  );

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["assignments"] });
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) =>
      apiFetch(`/assignments/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Assignment deleted");
      setDeleteTarget(null);
      invalidateAll();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not delete assignment"
      );
    },
  });

  const now = Date.now();

  const stats = useMemo(() => {
    const total = assignments.length;
    let pending = 0;
    let graded = 0;
    let pastDeadline = 0;
    assignments.forEach((assignment) => {
      pending += Math.max(0, assignment.submissionsCount - assignment.gradedCount);
      graded += assignment.gradedCount;
      if (assignment.deadline && new Date(assignment.deadline).getTime() < now) {
        pastDeadline += 1;
      }
    });
    return { total, pending, graded, pastDeadline };
  }, [assignments, now]);

  const filtered = assignments.filter(
    (assignment) =>
      moduleFilter === "all" || assignment.moduleId === moduleFilter
  );

  const selectedCourse = courses.find((course: Course) => course.id === courseId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assignments</h1>
          <p className="text-sm text-muted-foreground">
            Create and grade assignments across your courses.
          </p>
        </div>
        <Button
          onClick={() => { setEditAssignment(null); setFormOpen(true); }}
        >
          <Plus className="size-4" />
          Create Assignment
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <ClipboardList className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Submissions</CardTitle>
            <Hourglass className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Graded</CardTitle>
            <Timer className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-600">{stats.graded}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Past Deadline</CardTitle>
            <FileText className="size-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-destructive">{stats.pastDeadline}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
        <Select
          value={courseId}
          onValueChange={(value) => {
            setCourseId(value ?? "");
            setModuleFilter("all");
          }}
        >
          <SelectTrigger>
            <SelectValue>
              {(current: string) =>
                (courses.find((course: Course) => course.id === current)?.title) ||
                "Select a course"
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

        <Select
          value={moduleFilter}
          onValueChange={(value) => setModuleFilter(value ?? "all")}
        >
          <SelectTrigger>
            <SelectValue>
              {(current: string) =>
                current === "all"
                  ? "All Modules"
                  : moduleLabel(modules, current) || "All Modules"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modules</SelectItem>
            {modules.map((mod) => (
              <SelectItem key={mod.id} value={mod.id}>
                {moduleLabel(modules, mod.id)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {coursesQuery.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          No courses available. Create a course first.
        </div>
      ) : modulesQuery.isLoading ? (
        <div className="space-y-3">
          {[0, 1].map((index) => (
            <Skeleton key={index} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : assignmentsQuery.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : modules.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <ClipboardList className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-4 font-medium">No modules yet</p>
          <p className="text-sm text-muted-foreground">
            Add modules to &quot;{selectedCourse?.title ?? "this course"}&quot; before
            creating assignments.
          </p>
        </div>
      ) : assignments.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <ClipboardList className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-4 font-medium">No assignments yet</p>
          <p className="text-sm text-muted-foreground">
            Create the first assignment for &quot;{selectedCourse?.title ?? "this course"}&quot;.
          </p>
          <Button
            className="mt-4"
            onClick={() => { setEditAssignment(null); setFormOpen(true); }}
          >
            <Plus className="size-4" />
            Create Assignment
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          No assignments match the selected module.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((assignment) => {
            const deadline = assignment.deadline
              ? new Date(assignment.deadline)
              : null;
            const isPast =
              deadline !== null && deadline.getTime() < now;
            const isDueSoon =
              deadline !== null &&
              !isPast &&
              deadline.getTime() - now < 3 * 24 * 60 * 60 * 1000;
            return (
              <div key={assignment.id} className="rounded-xl border bg-card p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/assignments/${assignment.id}`}
                        className="truncate font-semibold hover:underline"
                      >
                        {assignment.title}
                      </Link>
                      {isPast ? (
                        <Badge className="bg-destructive text-white">Past Deadline</Badge>
                      ) : isDueSoon ? (
                        <Badge className="bg-amber-100 text-amber-700">
                          Due Soon
                        </Badge>
                      ) : null}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary">{moduleLabel(modules, assignment.moduleId)}</Badge>
                      {(() => {
                        const mod = modules.find(
                          (item) => item.id === assignment.moduleId
                        );
                        const batch = mod?.batchId
                          ? batchMap.get(mod.batchId)
                          : null;
                        return batch ? (
                          <Badge variant="outline" className="border-indigo-200 text-indigo-600">
                            Batch {batch.batchNumber}
                            {batch.title ? ` · ${batch.title}` : ""}
                          </Badge>
                        ) : mod?.batchId ? (
                          <Badge variant="outline">Batch course</Badge>
                        ) : null;
                      })()}
                      <Badge variant="outline">{assignment.totalMarks} marks</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        {deadline
                          ? `Due ${format(deadline, "MMM d, yyyy · h:mm a")}`
                          : "No deadline"}
                      </span>
                      <span>
                        {assignment.submissionsCount} submissions ·{" "}
                        {assignment.gradedCount} graded
                      </span>
                      {assignment.docUrl ? (
                        <a
                          href={assignment.docUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 font-medium text-primary hover:underline"
                        >
                          <LinkIcon className="size-3.5" />
                          View document
                        </a>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      nativeButton={false}
                      render={
                        <Link href={`/admin/assignments/${assignment.id}`} />
                      }
                    >
                      View Submissions
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => { setEditAssignment(assignment); setFormOpen(true); }}
                      title="Edit assignment"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(assignment)}
                      title="Delete assignment"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AssignmentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        existing={editAssignment}
        onSuccess={invalidateAll}
      />

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove &quot;{deleteTarget?.title}&quot; and all its
              submissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
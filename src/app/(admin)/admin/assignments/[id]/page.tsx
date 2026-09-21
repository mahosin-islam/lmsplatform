"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  ArrowLeft,
  Award,
  Eye,
  FileText,
  Hourglass,
  Link as LinkIcon,
  Loader2,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { apiFetch } from "@/lib/api";
import type { Assignment, AssignmentSubmission, Course } from "@/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AssignmentFormDialog } from "@/components/admin/AssignmentFormDialog";
import { GradeSubmissionDialog } from "@/components/admin/GradeSubmissionDialog";
import { SubmissionViewDialog } from "@/components/admin/SubmissionViewDialog";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function AssignmentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id;

  const [filter, setFilter] = useState<"all" | "SUBMITTED" | "GRADED">("all");
  const [viewTarget, setViewTarget] = useState<AssignmentSubmission | null>(null);
  const [gradeTarget, setGradeTarget] = useState<AssignmentSubmission | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const detailQuery = useQuery({
    queryKey: ["assignment", id],
    enabled: Boolean(id),
    queryFn: async (): Promise<(Assignment & { courseTitle?: string }) | null> => {
      const res = await apiFetch<Assignment>(`/assignments/${id}`);
      const data = res.data;
      if (data?.module?.courseId) {
        const course = (
          await apiFetch<Course>(`/courses/${data.module.courseId}`)
        ).data;
        return { ...data, courseTitle: course?.title };
      }
      return data;
    },
  });

  const assignment = detailQuery.data;

  const invalidateDetail = () => {
    queryClient.invalidateQueries({ queryKey: ["assignment", id] });
  };

  const deleteMutation = useMutation({
    mutationFn: async () => apiFetch(`/assignments/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Assignment deleted");
      setDeleteOpen(false);
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      router.push("/admin/assignments");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not delete assignment"
      );
    },
  });

  const now = Date.now();

  const sortedSubmissions = useMemo(() => {
    const list = assignment?.submissions ?? [];
    return [...list].sort((a, b) => {
      const aGraded = a.status === "GRADED" ? 1 : 0;
      const bGraded = b.status === "GRADED" ? 1 : 0;
      if (aGraded !== bGraded) return aGraded - bGraded;
      return (
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
    });
  }, [assignment]);

  const filteredSubmissions = sortedSubmissions.filter(
    (submission) => filter === "all" || submission.status === filter
  );

  const submissions = assignment?.submissions ?? [];
  const gradedList = submissions.filter((submission) => submission.status === "GRADED");
  const gradedCount = gradedList.length;
  const pendingCount = submissions.length - gradedCount;
  const average =
    gradedList.length > 0
      ? Math.round(
          gradedList.reduce((sum, submission) => sum + (submission.marks ?? 0), 0) /
            gradedList.length
        )
      : null;
  const totalMarks = assignment?.totalMarks ?? 0;

  const deadline = assignment?.deadline ? new Date(assignment.deadline) : null;
  const isPast = Boolean(deadline && deadline.getTime() < now);
  const isDueSoon = Boolean(
    deadline &&
      deadline.getTime() >= now &&
      deadline.getTime() - now < 3 * 24 * 60 * 60 * 1000
  );

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/admin/assignments" />}>
        <ArrowLeft className="size-4" />
        Back to Assignments
      </Button>

      {detailQuery.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : !assignment ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          Assignment not found.
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">
                  {assignment.title}
                </h1>
                {isPast ? (
                  <Badge className="bg-destructive text-white">Past Deadline</Badge>
                ) : isDueSoon ? (
                  <Badge className="bg-amber-100 text-amber-700">Due Soon</Badge>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {assignment.courseTitle ?? "Course"}
                <span className="mx-2">/</span>
                {assignment.module?.title ?? "Module"}
                <span className="mx-2">/</span>
                {assignment.module?.batchId ? "Batch module" : "Course module"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="size-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Submissions</CardTitle>
                <Users className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{submissions.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Grading</CardTitle>
                <Hourglass className="size-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-amber-600">{pendingCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Graded</CardTitle>
                <Award className="size-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-emerald-600">{gradedCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                <FileText className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {average ?? "—"}
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}
                    / {totalMarks}
                  </span>
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {assignment.description ? (
                <p className="whitespace-pre-line">{assignment.description}</p>
              ) : (
                <p className="text-muted-foreground">No description provided.</p>
              )}
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-muted-foreground">
                <span>
                  Due{" "}
                  {deadline
                    ? format(deadline, "MMM d, yyyy · h:mm a")
                    : "No deadline"}
                </span>
                <span>{totalMarks} total marks</span>
                <span>Created {format(new Date(assignment.createdAt), "MMM d, yyyy")}</span>
              </div>
              {assignment.docUrl ? (
                <a
                  href={assignment.docUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                >
                  <LinkIcon className="size-4" />
                  View assignment document
                </a>
              ) : null}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold">Submissions</h2>
            <Tabs
              value={filter}
              onValueChange={(value) =>
                setFilter(value as "all" | "SUBMITTED" | "GRADED")
              }
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="SUBMITTED">Submitted</TabsTrigger>
                <TabsTrigger value="GRADED">Graded</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {submissions.length === 0 ? (
            <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
              No submissions yet. Students will see this assignment once created.
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              No submissions match this filter.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => {
                    const learner = submission.learner;
                    return (
                      <TableRow key={submission.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="size-8">
                              {learner?.avatar ? (
                                <AvatarImage src={learner.avatar} alt={learner.name} />
                              ) : null}
                              <AvatarFallback className="text-xs">
                                {initials(learner?.name ?? "?")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {learner?.name ?? "Unknown student"}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {learner?.email ?? ""}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(submission.submittedAt), {
                            addSuffix: true,
                          })}
                        </TableCell>
                        <TableCell>
                          {submission.status === "GRADED" ? (
                            <span className="font-medium">
                              {submission.marks}
                              <span className="text-muted-foreground">
                                {" "}
                                / {totalMarks}
                              </span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {submission.status === "GRADED" ? (
                            <Badge className="bg-emerald-100 text-emerald-700">
                              Graded
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Submitted</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              title="View submission"
                              onClick={() => setViewTarget(submission)}
                            >
                              <Eye className="size-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setGradeTarget(submission)}
                            >
                              {submission.status === "GRADED" ? "Re-grade" : "Grade"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      <SubmissionViewDialog
        open={Boolean(viewTarget)}
        onOpenChange={(open) => {
          if (!open) setViewTarget(null);
        }}
        submission={viewTarget}
        totalMarks={totalMarks}
        onGrade={(submission) => setGradeTarget(submission)}
      />

      <GradeSubmissionDialog
        open={Boolean(gradeTarget)}
        onOpenChange={(open) => {
          if (!open) setGradeTarget(null);
        }}
        submission={gradeTarget}
        totalMarks={totalMarks}
        onSuccess={invalidateDetail}
      />

      <AssignmentFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        existing={
          assignment
            ? { ...assignment, courseId: assignment.module?.courseId ?? "" }
            : null
        }
        onSuccess={() => {
          invalidateDetail();
          queryClient.invalidateQueries({ queryKey: ["assignments"] });
        }}
      />

      <AlertDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!open) setDeleteOpen(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove &quot;{assignment?.title}&quot; and all its
              submissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
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
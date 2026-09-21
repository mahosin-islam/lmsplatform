"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  AlertTriangle,
  Award,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock,
  ExternalLink,
  FileText,
  Loader2,
  RefreshCcw,
  Upload,
} from "lucide-react";
import { cn } from "cn";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  getDeadlineStatus,
  gradeLetter,
  scoreBadgeClass,
} from "@/lib/assignment-utils";
import type {
  AssignmentListData,
  AssignmentSubmission,
  AssignmentSubmissionListData,
  EnrollmentListData,
  ModuleListData,
} from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  SubmitAssignmentDialog,
  type EnrichedAssignment,
} from "@/components/learner/SubmitAssignmentDialog";
import { ViewSubmissionDialog } from "@/components/learner/ViewSubmissionDialog";

function StatCard({
  icon: Icon,
  value,
  label,
  iconBg,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
  iconBg: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <span
          className={cn(
            "inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-white",
            iconBg
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function deadlineBadgeClass(color: "red" | "amber" | "gray"): string {
  if (color === "red") return "bg-red-100 text-red-700";
  if (color === "amber") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-500";
}

const PENDING_EMPTY = "You're all caught up! No pending assignments right now.";
const SUBMITTED_EMPTY = "Nothing submitted yet. Pending assignments are waiting below.";
const GRADED_EMPTY = "No graded assignments yet.";

export default function LearnerAssignmentsPage() {
  const { user } = useAuth();
  const learnerId = user?.id ?? "";

  const [submitting, setSubmitting] = React.useState<EnrichedAssignment | null>(
    null
  );
  const [viewing, setViewing] = React.useState<AssignmentSubmission | null>(
    null
  );
  const [viewingDetails, setViewingDetails] =
    React.useState<EnrichedAssignment | null>(null);

  const enrollmentsQuery = useQuery({
    queryKey: ["enrollments", "my", learnerId],
    enabled: Boolean(learnerId),
    queryFn: async () =>
      (await apiFetch<EnrollmentListData>(`/enrollments/my/${learnerId}`)).data,
  });

  const enrollments = React.useMemo(
    () => enrollmentsQuery.data?.enrollments ?? [],
    [enrollmentsQuery.data]
  );

  const courseTitleById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const enrollment of enrollments) {
      if (enrollment.course?.id && enrollment.course.title) {
        map.set(enrollment.course.id, enrollment.course.title);
      }
    }
    return map;
  }, [enrollments]);

  const enrolledPairs = React.useMemo(() => {
    const set = new Set<string>();
    const pairs: { courseId: string; batchId: string | null }[] = [];
    for (const enrollment of enrollments) {
      if (enrollment.status !== "ACTIVE" && enrollment.status !== "COMPLETED") {
        continue;
      }
      const courseId = enrollment.courseId;
      const batchId = enrollment.batchId;
      const key = `${courseId}:${batchId ?? "none"}`;
      if (set.has(key)) continue;
      set.add(key);
      pairs.push({ courseId, batchId });
    }
    return pairs;
  }, [enrollments]);

  const submissionsQuery = useQuery({
    queryKey: ["my-submissions", learnerId],
    enabled: Boolean(learnerId),
    queryFn: async () =>
      (
        await apiFetch<AssignmentSubmissionListData>(
          `/assignments/my/${learnerId}`
        )
      ).data,
  });

  const assignmentsQuery = useQuery({
    queryKey: ["all-my-assignments", learnerId, enrolledPairs],
    enabled: Boolean(learnerId) && enrolledPairs.length > 0,
    queryFn: async () => {
      const allAssignments: EnrichedAssignment[] = [];

      for (const pair of enrolledPairs) {
        const { courseId, batchId } = pair;
        let modules: ModuleListData["modules"] = [];
        try {
          const modulesData = await apiFetch<ModuleListData>(
            `/modules/course/${courseId}${
              batchId ? `?batchId=${batchId}` : ""
            }`
          );
          modules = modulesData.data?.modules ?? [];
        } catch (err) {
          console.warn("Could not load modules for course", courseId, err);
          continue;
        }

        for (const mod of modules) {
          let assignList: AssignmentListData["assignments"] = [];
          try {
            const assignData = await apiFetch<AssignmentListData>(
              `/assignments/module/${mod.id}`
            );
            assignList = assignData.data?.assignments ?? [];
          } catch (err) {
            console.warn("Could not load assignments for module", mod.id, err);
            continue;
          }

          for (const assignment of assignList) {
            const enrollment = enrollments.find(
              (e) => e.courseId === courseId && e.batchId === batchId
            );
            allAssignments.push({
              ...assignment,
              courseTitle: courseTitleById.get(courseId) ?? "Course",
              batchTitle: enrollment?.batch?.title,
            });
          }
        }
      }

      return allAssignments;
    },
  });

  const allAssignments = React.useMemo(
    () => assignmentsQuery.data ?? [],
    [assignmentsQuery.data]
  );
  const submissions = React.useMemo(
    () => submissionsQuery.data?.submissions ?? [],
    [submissionsQuery.data]
  );

  const submittedAssignmentIds = React.useMemo(
    () => new Set(submissions.map((s) => s.assignmentId)),
    [submissions]
  );

  const pending = React.useMemo(
    () => allAssignments.filter((a) => !submittedAssignmentIds.has(a.id)),
    [allAssignments, submittedAssignmentIds]
  );

  const submitted = React.useMemo(
    () => submissions.filter((s) => s.status === "SUBMITTED"),
    [submissions]
  );

  const graded = React.useMemo(
    () => submissions.filter((s) => s.status === "GRADED"),
    [submissions]
  );

  const isLoading = enrollmentsQuery.isLoading || submissionsQuery.isLoading;
  const isError =
    (enrollmentsQuery.isError && !enrollmentsQuery.data) ||
    (submissionsQuery.isError && !submissionsQuery.data);

  if (isError) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center">
        <p className="font-medium">Couldn&apos;t load your assignments</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {enrollmentsQuery.error instanceof Error
            ? enrollmentsQuery.error.message
            : submissionsQuery.error instanceof Error
              ? submissionsQuery.error.message
              : "Please try again."}
        </p>
        <Button className="mt-4" onClick={() => window.location.reload()}>
          <RefreshCcw className="size-4" />
          Reload
        </Button>
      </div>
    );
  }

  const moduleLabel = (assignment: EnrichedAssignment) => {
    const parts: string[] = [];
    if (assignment.courseTitle) parts.push(assignment.courseTitle);
    if (assignment.module?.title) parts.push(assignment.module.title);
    if (assignment.batchTitle) parts.push(assignment.batchTitle);
    return parts.join(" · ");
  };

  const submissionModuleLabel = (submission: AssignmentSubmission) => {
    const parts: string[] = [];
    const courseId = submission.assignment?.module?.courseId;
    if (courseId && courseTitleById.has(courseId)) {
      parts.push(courseTitleById.get(courseId) ?? "Course");
    }
    if (submission.assignment?.module?.title) {
      parts.push(submission.assignment.module.title);
    }
    return parts.join(" · ");
  };

  const viewingDetailsOverdue = Boolean(
    viewingDetails &&
      getDeadlineStatus(viewingDetails.deadline).overdue &&
      !submittedAssignmentIds.has(viewingDetails.id)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Assignments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Submit your assignments and track your grades
        </p>
      </div>

      {isLoading ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-24 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={ClipboardList}
            value={String(allAssignments.length)}
            label="Total"
            iconBg="bg-indigo-500"
          />
          <StatCard
            icon={Clock}
            value={String(pending.length)}
            label="Pending"
            iconBg="bg-amber-500"
          />
          <StatCard
            icon={CheckCircle2}
            value={String(submitted.length + graded.length)}
            label="Submitted"
            iconBg="bg-emerald-500"
          />
        </div>
      )}

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending
            {pending.length > 0 ? (
              <Badge
                variant="secondary"
                className="bg-amber-100 text-amber-700"
              >
                {pending.length}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="submitted">
            Submitted
            {submitted.length > 0 ? (
              <Badge
                variant="secondary"
                className="bg-slate-100 text-slate-500"
              >
                {submitted.length}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="graded">
            Graded
            {graded.length > 0 ? (
              <Badge
                variant="secondary"
                className="bg-emerald-100 text-emerald-700"
              >
                {graded.length}
              </Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <div className="space-y-4">
            {pending.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-12 text-center">
                <span className="inline-flex size-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-500">
                  <ClipboardList className="size-7" />
                </span>
                <div>
                  <p className="font-medium">
                    All caught up
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {PENDING_EMPTY}
                  </p>
                </div>
              </div>
            ) : (
              pending.map((assignment) => {
                const deadlineStatus = getDeadlineStatus(assignment.deadline);
                return (
                  <Card key={assignment.id}>
                    <CardContent className="p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                            <FileText className="size-5" />
                          </span>
                          <div className="min-w-0 space-y-1">
                            <p className="truncate font-semibold">
                              {assignment.title}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {moduleLabel(assignment)}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant="secondary"
                                className={cn(
                                  "font-medium",
                                  deadlineBadgeClass(deadlineStatus.color)
                                )}
                              >
                                <CalendarClock className="size-3" />
                                {deadlineStatus.label}
                                {deadlineStatus.overdue ? (
                                  <AlertTriangle className="size-3" />
                                ) : null}
                              </Badge>
                              <Badge variant="secondary">
                                {assignment.totalMarks} marks
                              </Badge>
                            </div>
                            {assignment.description ? (
                              <p className="line-clamp-2 text-sm text-muted-foreground">
                                {assignment.description}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setViewingDetails(assignment);
                            }}
                          >
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            disabled={deadlineStatus.overdue}
                            onClick={() => setSubmitting(assignment)}
                          >
                            <Upload className="size-4" />
                            Submit
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="submitted" className="mt-4">
          <div className="space-y-4">
            {submitted.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-12 text-center">
                <span className="inline-flex size-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Clock className="size-7" />
                </span>
                <div>
                  <p className="font-medium">No submissions yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {SUBMITTED_EMPTY}
                  </p>
                </div>
              </div>
            ) : (
              submitted.map((submission) => (
                <Card key={submission.id}>
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                          <Clock className="size-5" />
                        </span>
                        <div className="min-w-0 space-y-1">
                          <p className="truncate font-semibold">
                            {submission.assignment?.title ?? "Assignment"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {submissionModuleLabel(submission) || "Assignment"}
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant="secondary"
                              className="bg-amber-100 text-amber-700"
                            >
                              Waiting for grade
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Submitted{" "}
                              {format(
                                new Date(submission.submittedAt),
                                "MMM d, yyyy"
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewing(submission)}
                      >
                        <ExternalLink className="size-4" />
                        View Submission
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="graded" className="mt-4">
          <div className="space-y-4">
            {graded.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-12 text-center">
                <span className="inline-flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <Award className="size-7" />
                </span>
                <div>
                  <p className="font-medium">No graded assignments</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {GRADED_EMPTY}
                  </p>
                </div>
              </div>
            ) : (
              graded.map((submission) => {
                const totalMarks = submission.assignment?.totalMarks ?? 0;
                const percent =
                  submission.marks != null && totalMarks > 0
                    ? Math.round((submission.marks / totalMarks) * 100)
                    : null;
                return (
                  <Card key={submission.id}>
                    <CardContent className="p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                            <Award className="size-5" />
                          </span>
                          <div className="min-w-0 space-y-1">
                            <p className="truncate font-semibold">
                              {submission.assignment?.title ?? "Assignment"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {submissionModuleLabel(submission) || "Assignment"}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant="secondary"
                                className={cn(
                                  "font-semibold tabular-nums",
                                  scoreBadgeClass(percent ?? 0)
                                )}
                              >
                                {submission.marks} / {totalMarks}
                              </Badge>
                              {percent != null ? (
                                <Badge variant="secondary">
                                  {percent}% · {gradeLetter(percent)}
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewing(submission)}
                        >
                          <ExternalLink className="size-4" />
                          View Submission
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      <SubmitAssignmentDialog
        open={Boolean(submitting)}
        onOpenChange={(open) => {
          if (!open) setSubmitting(null);
        }}
        assignment={submitting}
        onSuccess={() => {
          assignmentsQuery.refetch();
          submissionsQuery.refetch();
        }}
      />

      <ViewSubmissionDialog
        open={Boolean(viewing)}
        onOpenChange={(open) => {
          if (!open) setViewing(null);
        }}
        submission={viewing}
      />

      <Dialog
        open={Boolean(viewingDetails)}
        onOpenChange={(open) => {
          if (!open) setViewingDetails(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewingDetails?.title}</DialogTitle>
            <DialogDescription>
              {viewingDetails ? moduleLabel(viewingDetails) : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Description</p>
              <p className="text-sm text-muted-foreground">
                {viewingDetails?.description || "No description provided."}
              </p>
            </div>
            {viewingDetails?.docUrl ? (
              <div className="space-y-1">
                <p className="text-sm font-medium">Instructions</p>
                <a
                  href={viewingDetails.docUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:underline"
                >
                  Open instructions <ExternalLink className="size-3.5" />
                </a>
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                <CalendarClock className="size-3" />
                {viewingDetails
                  ? getDeadlineStatus(viewingDetails.deadline).label
                  : ""}
              </Badge>
              <Badge variant="secondary">
                {viewingDetails?.totalMarks ?? 0} marks
              </Badge>
            </div>
            {viewingDetailsOverdue ? (
                <p className="flex items-center gap-1.5 text-sm text-red-600">
                  <AlertTriangle className="size-4" />
                  This assignment is overdue. Submissions are closed.
                </p>
              ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="size-3.5" />
        Deadlines and late-submission policies are set by your instructor.
      </p>
    </div>
  );
}
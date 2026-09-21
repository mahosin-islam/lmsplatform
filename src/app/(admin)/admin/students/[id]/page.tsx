"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Boxes,
  Copy,
  CheckCircle2,
  FileText,
  GraduationCap,
  Loader2,
  RefreshCw,
  Send,
  Wallet,
} from "lucide-react";
import { cn } from "cn";

import { apiFetch } from "@/lib/api";
import {
  copyToClipboard,
  formatDate,
  formatPrice,
  shortenTx,
  timeAgo,
} from "@/lib/course-utils";
import type {
  AssignmentSubmissionListData,
  CertificateListData,
  EnrollmentListData,
  EnrollmentStatus,
  LearnerDashboardData,
  OrderListData,
  User,
} from "@/types";
import { ORDER_BADGE, PROVIDER_BADGE, PROVIDER_LABEL } from "@/lib/payment-utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const ENROLLMENT_BADGE: Record<EnrollmentStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  CANCELLED: "bg-slate-200 text-slate-600",
};

function getUserInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase() || "?";
}

const notifySchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  message: z.string().min(3, "Message must be at least 3 characters"),
});

type NotifyValues = z.infer<typeof notifySchema>;

function copyText(text: string, label: string): void {
  void copyToClipboard(text).then((ok) => {
    if (ok) toast.success(`${label} copied to clipboard`);
    else toast.error("Could not copy to clipboard");
  });
}

export default function AdminStudentDetailPage() {
  const params = useParams<{ id: string }>();
  const learnerId = params?.id ?? "";
  const queryClient = useQueryClient();
  const [tab, setTab] = React.useState("enrollments");
  const [notifyOpen, setNotifyOpen] = React.useState(false);
  const [sendingNotify, setSendingNotify] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NotifyValues>({
    resolver: zodResolver(notifySchema),
    defaultValues: { title: "", message: "" },
  });

  React.useEffect(() => {
    if (notifyOpen) reset({ title: "", message: "" });
  }, [notifyOpen, reset]);

  const studentQuery = useQuery({
    queryKey: ["student", learnerId],
    queryFn: async () =>
      (await apiFetch<User>(`/users/${learnerId}`)).data,
    enabled: Boolean(learnerId),
  });

  const summaryQuery = useQuery({
    queryKey: ["student-summary", learnerId],
    queryFn: async () =>
      (
        await apiFetch<LearnerDashboardData>(
          `/dashboard/learner/${learnerId}`
        )
      ).data,
    enabled: Boolean(learnerId),
  });

  const enrollmentsQuery = useQuery({
    queryKey: ["enrollments", "my", learnerId],
    queryFn: async () =>
      (await apiFetch<EnrollmentListData>(`/enrollments/my/${learnerId}`)).data,
    enabled: Boolean(learnerId),
  });

  const ordersQuery = useQuery({
    queryKey: ["payments", "my", learnerId],
    queryFn: async () =>
      (await apiFetch<OrderListData>(`/payments/my/${learnerId}`)).data,
    enabled: Boolean(learnerId),
  });

  const certificatesQuery = useQuery({
    queryKey: ["certificates", "my", learnerId],
    queryFn: async () =>
      (await apiFetch<CertificateListData>(`/certificates/my/${learnerId}`))
        .data,
    enabled: Boolean(learnerId),
  });

  const submissionsQuery = useQuery({
    queryKey: ["assignments", "my", learnerId],
    queryFn: async () =>
      (await apiFetch<AssignmentSubmissionListData>(
        `/assignments/my/${learnerId}`
      )).data,
    enabled: Boolean(learnerId),
  });

  const enrollments = React.useMemo(
    () => enrollmentsQuery.data?.enrollments ?? [],
    [enrollmentsQuery.data]
  );

  const avgProgress = React.useMemo(() => {
    const relevant = enrollments.filter((e) => e.status !== "CANCELLED");
    if (relevant.length === 0) return null;
    const sum = relevant.reduce((acc, e) => acc + (e.progress ?? 0), 0);
    return Math.round(sum / relevant.length);
  }, [enrollments]);

  const student = studentQuery.data;

  const onSendNotification = async (values: NotifyValues) => {
    setSendingNotify(true);
    try {
      await apiFetch("/notifications/send", {
        method: "POST",
        body: {
          userId: learnerId,
          type: "ANNOUNCEMENT",
          title: values.title.trim(),
          message: values.message.trim(),
        },
      });
      toast.success("Notification sent");
      setNotifyOpen(false);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not send notification"
      );
    } finally {
      setSendingNotify(false);
    }
  };

  if (studentQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (studentQuery.isError || !student) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <span className="inline-flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="size-6" />
          </span>
          <div>
            <p className="font-semibold">Could not load the student</p>
            <p className="text-sm text-muted-foreground">
              {studentQuery.error instanceof Error
                ? studentQuery.error.message
                : "Something went wrong."}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/admin/students" />}
          >
            <ArrowLeft className="size-4" />
            Back to students
          </Button>
        </CardContent>
      </Card>
    );
  }

  const summary = summaryQuery.data;
  const infoCards = [
    {
      label: "Total Enrollments",
      value: summary?.enrollments.total ?? 0,
      icon: GraduationCap,
      tint: "bg-blue-100 text-blue-600",
    },
    {
      label: "Active Enrollments",
      value: summary?.enrollments.active ?? 0,
      icon: CheckCircle2,
      tint: "bg-emerald-100 text-emerald-600",
    },
    {
      label: "Certificates",
      value: summary?.certificates ?? 0,
      icon: Award,
      tint: "bg-violet-100 text-violet-600",
    },
    {
      label: "Avg Progress",
      value: avgProgress === null ? "\u2014" : `${avgProgress}%`,
      icon: BarChart3,
      tint: "bg-amber-100 text-amber-600",
    },
  ];

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 w-fit"
        nativeButton={false}
        render={<Link href="/admin/students" />}
      >
        <ArrowLeft className="size-4" />
        Back to students
      </Button>

      <Card>
        <CardContent className="flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar className="size-16">
              {student.avatar ? (
                <AvatarImage src={student.avatar} alt={student.name} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-xl font-semibold text-primary">
                {getUserInitials(student.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
                  {student.name}
                </h1>
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-700"
                >
                  LEARNER
                </Badge>
              </div>
              <p className="truncate text-sm text-muted-foreground">
                {student.email}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Joined {formatDate(student.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                summaryQuery.refetch();
                enrollmentsQuery.refetch();
                ordersQuery.refetch();
                certificatesQuery.refetch();
                submissionsQuery.refetch();
              }}
              disabled={
                summaryQuery.isFetching ||
                enrollmentsQuery.isFetching ||
                ordersQuery.isFetching ||
                certificatesQuery.isFetching ||
                submissionsQuery.isFetching
              }
            >
              <RefreshCw className="size-4" />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setNotifyOpen(true)}>
              <Bell className="size-4" />
              Send Notification
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {infoCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardContent className="flex items-center gap-3 p-4">
                <span
                  className={cn(
                    "inline-flex size-10 shrink-0 items-center justify-center rounded-lg",
                    card.tint
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-2xl font-bold tabular-nums">
                    {card.value}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {card.label}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(String(value))}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="enrollments">
            Enrollments ({summary?.enrollments.total ?? 0})
          </TabsTrigger>
          <TabsTrigger value="payments">
            Payments ({ordersQuery.data?.total ?? 0})
          </TabsTrigger>
          <TabsTrigger value="certificates">
            Certificates ({summary?.certificates ?? 0})
          </TabsTrigger>
          <TabsTrigger value="activity">
            Activity ({submissionsQuery.data?.total ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="enrollments">
          {enrollmentsQuery.isLoading ? (
            <Card>
              <CardContent className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full rounded-lg" />
                ))}
              </CardContent>
            </Card>
          ) : enrollments.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No enrollments"
              hint="This student has not enrolled in any course yet."
            />
          ) : (
            <div className="space-y-3">
              {enrollments.map((enrollment) => (
                <Card key={enrollment.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium">
                          {enrollment.course?.title ?? "Course"}
                        </p>
                        {enrollment.batch ? (
                          <Badge
                            variant="secondary"
                            className="bg-violet-100 text-violet-700"
                          >
                            <Boxes className="size-3" />
                            Batch {enrollment.batch.batchNumber}
                          </Badge>
                        ) : null}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <div className="h-1.5 w-24 rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{
                              width: `${Math.min(100, enrollment.progress ?? 0)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {enrollment.progress ?? 0}%
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge
                        variant="secondary"
                        className={ENROLLMENT_BADGE[enrollment.status]}
                      >
                        {enrollment.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {timeAgo(enrollment.enrolledAt)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="payments">
          {ordersQuery.isLoading ? (
            <Card>
              <CardContent className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full rounded-lg" />
                ))}
              </CardContent>
            </Card>
          ) : (ordersQuery.data?.orders?.length ?? 0) === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No payments"
              hint="This student has not made any payments yet."
            />
          ) : (
            <Card className="overflow-hidden p-0">
              {(ordersQuery.data?.orders ?? []).map((order) => (
                <div
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b p-4 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {order.course?.title ?? "Course"}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {order.provider ? (
                        <Badge
                          variant="secondary"
                          className={PROVIDER_BADGE[order.provider]}
                        >
                          {PROVIDER_LABEL[order.provider]}
                        </Badge>
                      ) : null}
                      {order.batch ? (
                        <span>Batch {order.batch.batchNumber}</span>
                      ) : null}
                      {order.transactionId ? (
                        <button
                          type="button"
                          onClick={() =>
                            copyText(order.transactionId ?? "", "TrxID")
                          }
                          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                        >
                          <Copy className="size-3" />
                          {shortenTx(order.transactionId)}
                        </button>
                      ) : null}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {timeAgo(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-bold tabular-nums">
                      {formatPrice(order.amount)}
                    </span>
                    <Badge
                      variant="secondary"
                      className={ORDER_BADGE[order.status]}
                    >
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </Card>
          )}
        </TabsContent>

        <TabsContent value="certificates">
          {certificatesQuery.isLoading ? (
            <Card>
              <CardContent className="space-y-3">
                {Array.from({ length: 2 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full rounded-lg" />
                ))}
              </CardContent>
            </Card>
          ) : (certificatesQuery.data?.certificates?.length ?? 0) === 0 ? (
            <EmptyState
              icon={Award}
              title="No certificates"
              hint="This student has not earned any certificates yet."
            />
          ) : (
            <div className="space-y-3">
              {(certificatesQuery.data?.certificates ?? []).map((certificate) => (
                <Card key={certificate.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {certificate.course?.title ?? "Course"}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {certificate.certificateCode}
                        {certificate.batch
                          ? ` · Batch ${certificate.batch.batchNumber}`
                          : ""}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-medium text-emerald-700">
                        Issued
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(certificate.issuedAt)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity">
          {submissionsQuery.isLoading ? (
            <Card>
              <CardContent className="space-y-3">
                {Array.from({ length: 2 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full rounded-lg" />
                ))}
              </CardContent>
            </Card>
          ) : (submissionsQuery.data?.submissions?.length ?? 0) === 0 ? (
            <EmptyState
              icon={FileText}
              title="No activity yet"
              hint="Assignment submissions and quiz attempts will appear here."
            />
          ) : (
            <div className="space-y-3">
              {(submissionsQuery.data?.submissions ?? []).map((submission) => (
                <Card key={submission.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <FileText className="size-4 shrink-0 text-primary" />
                        <p className="truncate font-medium">
                          {submission.assignment?.title ?? "Assignment"}
                        </p>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {submission.assignment?.module?.title ?? "Module"} ·
                        submitted {timeAgo(submission.submittedAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {submission.marks !== null &&
                      submission.assignment?.totalMarks ? (
                        <Badge
                          variant="secondary"
                          className="bg-emerald-100 text-emerald-700"
                        >
                          {submission.marks}/{submission.assignment.totalMarks}
                        </Badge>
                      ) : null}
                      <Badge
                        variant="secondary"
                        className={
                          submission.status === "GRADED"
                            ? "bg-emerald-100 text-emerald-700"
                            : submission.status === "SUBMITTED"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-amber-100 text-amber-700"
                        }
                      >
                        {submission.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={notifyOpen} onOpenChange={setNotifyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send notification</DialogTitle>
            <DialogDescription>
              Send an announcement to {student.name}.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleSubmit(onSendNotification)}
            className="space-y-4"
            noValidate
          >
            <div className="space-y-2">
              <Label htmlFor="notify-title">Title</Label>
              <Input
                id="notify-title"
                placeholder="e.g. New batch announcement"
                aria-invalid={Boolean(errors.title)}
                {...register("title")}
              />
              {errors.title ? (
                <p className="text-xs text-destructive">
                  {errors.title.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="notify-message">Message</Label>
              <Textarea
                id="notify-message"
                rows={3}
                placeholder="Write your message..."
                aria-invalid={Boolean(errors.message)}
                {...register("message")}
              />
              {errors.message ? (
                <p className="text-xs text-destructive">
                  {errors.message.message}
                </p>
              ) : null}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setNotifyOpen(false)}
                disabled={sendingNotify}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={sendingNotify}>
                {sendingNotify ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    Send
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint: string;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Icon className="size-7" />
        </span>
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground">{hint}</p>
        </div>
      </CardContent>
    </Card>
  );
}
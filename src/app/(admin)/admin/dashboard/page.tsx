"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  RefreshCw,
  Star,
  TrendingUp,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { cn } from "cn";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatDate, formatPrice } from "@/lib/course-utils";
import type {
  AdminStats,
  Order,
  OrderListData,
  RecentActivityData,
  TopStudentsData,
} from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type PaymentAction = "APPROVE" | "REJECT";

function getUserInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase() || "?";
}

function formatMoney(value: number): string {
  return `৳${value.toLocaleString("en-US")}`;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "size-3.5",
            i < Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "text-slate-300"
          )}
        />
      ))}
    </span>
  );
}

function EmptyRow({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <span className="inline-flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <AlertCircle className="size-5" />
      </span>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <Card className="border-destructive/30">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="size-6" />
        </span>
        <div>
          <p className="font-semibold">Could not load the dashboard</p>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="size-4" />
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <Skeleton className="size-11 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
  tint: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <span
          className={cn(
            "inline-flex size-11 shrink-0 items-center justify-center rounded-xl",
            tint
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <p className="truncate text-2xl font-bold">{value}</p>
          <p className="truncate text-xs text-muted-foreground">{sub}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const statsQuery = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () =>
      (await apiFetch<AdminStats>("/dashboard/admin/stats")).data,
  });

  const activityQuery = useQuery({
    queryKey: ["admin", "activity"],
    queryFn: async () =>
      (await apiFetch<RecentActivityData>("/dashboard/admin/recent-activity"))
        .data,
  });

  const topStudentsQuery = useQuery({
    queryKey: ["admin", "top-students"],
    queryFn: async () =>
      (
        await apiFetch<TopStudentsData>(
          "/dashboard/admin/top-students?limit=5"
        )
      ).data,
  });

  const pendingQuery = useQuery({
    queryKey: ["admin", "pending-payments"],
    queryFn: async () =>
      (await apiFetch<OrderListData>("/payments/pending")).data,
  });

  const verifyMutation = useMutation({
    mutationFn: async ({
      id,
      action,
    }: {
      id: string;
      action: PaymentAction;
    }) => {
      const res = await apiFetch(`/payments/${id}/verify`, {
        method: "PATCH",
        body: { action },
      });
      return res;
    },
    onSuccess: (_data, variables) => {
      toast.success(
        variables.action === "APPROVE"
          ? "Payment approved"
          : "Payment rejected"
      );
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not update payment"
      );
    },
  });

  const isRefreshing =
    statsQuery.isFetching ||
    activityQuery.isFetching ||
    topStudentsQuery.isFetching ||
    pendingQuery.isFetching;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin"] });
  };

  if (statsQuery.isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <ErrorState
          message={
            statsQuery.error instanceof Error
              ? statsQuery.error.message
              : "Something went wrong."
          }
          onRetry={handleRefresh}
        />
      </div>
    );
  }

  const stats = statsQuery.data;
  const enrollments = activityQuery.data?.recentEnrollments ?? [];
  const reviews = activityQuery.data?.recentReviews ?? [];
  const orders = pendingQuery.data?.orders ?? [];
  const students = topStudentsQuery.data?.students ?? [];

  const cards = [
    {
      icon: Users,
      label: "Total Users",
      value: String(stats?.users.total ?? 0),
      sub: `${stats?.users.learners ?? 0} learners`,
      tint: "bg-blue-100 text-blue-600",
    },
    {
      icon: BookOpen,
      label: "Courses",
      value: String(stats?.courses.total ?? 0),
      sub: `${stats?.courses.batch ?? 0} batch · ${stats?.courses.fixed ?? 0} fixed`,
      tint: "bg-violet-100 text-violet-600",
    },
    {
      icon: GraduationCap,
      label: "Enrollments",
      value: String(stats?.enrollments.total ?? 0),
      sub: `${stats?.enrollments.active ?? 0} active`,
      tint: "bg-emerald-100 text-emerald-600",
    },
    {
      icon: Wallet,
      label: "Revenue",
      value: formatMoney(stats?.payments.totalRevenue ?? 0),
      sub: `${stats?.payments.pendingPayments ?? 0} pending payments`,
      tint: "bg-amber-100 text-amber-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back{user?.name ? `, ${user.name}` : ""}. Here is what is
            happening today.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsQuery.isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))
          : cards.map((card) => <StatCard key={card.label} {...card} />)}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Recent Enrollments</CardTitle>
            <CardDescription>Latest students joining your courses</CardDescription>
          </CardHeader>
          <CardContent>
            {activityQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : enrollments.length === 0 ? (
              <EmptyRow message="No enrollments yet." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((enrollment) => {
                    const status =
                      (enrollment as { status?: string }).status ?? "ACTIVE";
                    return (
                      <TableRow key={enrollment.id}>
                        <TableCell className="font-medium">
                          <span className="flex items-center gap-2">
                            <Avatar className="size-7">
                              <AvatarFallback className="bg-primary/10 text-[10px] text-primary">
                                {getUserInitials(enrollment.learner.name)}
                              </AvatarFallback>
                            </Avatar>
                            {enrollment.learner.name}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate text-muted-foreground">
                          {enrollment.course.title}
                        </TableCell>
                        <TableCell className="hidden whitespace-nowrap text-muted-foreground sm:table-cell">
                          {formatDate(enrollment.enrolledAt)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="bg-emerald-100 text-emerald-700"
                          >
                            {status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Payments</CardTitle>
            <CardDescription>Orders awaiting verification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingQuery.isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))
            ) : orders.length === 0 ? (
              <EmptyRow message="No pending payments." />
            ) : (
              orders.map((order: Order) => {
                const approving =
                  verifyMutation.isPending &&
                  verifyMutation.variables?.id === order.id &&
                  verifyMutation.variables?.action === "APPROVE";
                const rejecting =
                  verifyMutation.isPending &&
                  verifyMutation.variables?.id === order.id &&
                  verifyMutation.variables?.action === "REJECT";
                return (
                  <div
                    key={order.id}
                    className="rounded-lg border p-3 text-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {order.learner?.name ?? "Unknown learner"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {order.course?.title ?? "Course"}
                        </p>
                      </div>
                      <span className="shrink-0 font-semibold">
                        {formatPrice(order.amount)}
                      </span>
                    </div>
                    {order.transactionId ? (
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        Trx: {order.transactionId}
                      </p>
                    ) : null}
                    <div className="mt-3 flex items-center gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
                        disabled={verifyMutation.isPending}
                        onClick={() =>
                          verifyMutation.mutate({
                            id: order.id,
                            action: "APPROVE",
                          })
                        }
                      >
                        <CheckCircle2 className="size-4" />
                        {approving ? "Approving..." : "Approve"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-destructive hover:text-destructive"
                        disabled={verifyMutation.isPending}
                        onClick={() =>
                          verifyMutation.mutate({
                            id: order.id,
                            action: "REJECT",
                          })
                        }
                      >
                        <XCircle className="size-4" />
                        {rejecting ? "Rejecting..." : "Reject"}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              Top Students
            </CardTitle>
            <CardDescription>Most active learners</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topStudentsQuery.isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))
            ) : students.length === 0 ? (
              <EmptyRow message="No student data yet." />
            ) : (
              students.map((student) => (
                <div
                  key={student.userId}
                  className="flex items-center gap-3"
                >
                  <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                    {student.rank}
                  </span>
                  <Avatar className="size-8">
                    {student.avatar ? (
                      <AvatarImage
                        src={student.avatar}
                        alt={student.name}
                      />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-xs text-primary">
                      {getUserInitials(student.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {student.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {student.email}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {student.totalEnrollments}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Recent Reviews</CardTitle>
            <CardDescription>What learners are saying</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activityQuery.isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))
            ) : reviews.length === 0 ? (
              <EmptyRow message="No reviews yet." />
            ) : (
              reviews.map((review) => (
                <div
                  key={review.id}
                  className="flex items-start justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {review.learner.name}
                    </p>
                    <Link
                      href={`/courses/${review.course.id}`}
                      className="truncate text-xs text-muted-foreground hover:text-primary"
                    >
                      {review.course.title}
                    </Link>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Stars rating={review.rating} />
                    <span className="text-xs text-muted-foreground">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

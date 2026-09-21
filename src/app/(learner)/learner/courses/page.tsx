"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueries, useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, Clock, GraduationCap } from "lucide-react";
import { cn } from "cn";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type {
  CourseProgressData,
  Enrollment,
  EnrollmentListData,
  Order,
  OrderListData,
} from "@/types";
import { LEVEL_BADGE_CLASS } from "@/lib/course-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type FilterKey = "all" | "active" | "completed";

const FILTERS: { key: FilterKey; label: string; match: (e: Enrollment) => boolean }[] = [
  { key: "all", label: "All", match: () => true },
  { key: "active", label: "In Progress", match: (e) => e.status === "ACTIVE" },
  { key: "completed", label: "Completed", match: (e) => e.status === "COMPLETED" },
];

const EMPTY_COPY: Record<FilterKey, { title: string; subtitle: string }> = {
  all: {
    title: "No courses yet",
    subtitle: "Enroll in a course to start learning.",
  },
  active: {
    title: "No courses in progress",
    subtitle: "Courses you start will appear here.",
  },
  completed: {
    title: "No completed courses",
    subtitle: "Finished courses will show up here.",
  },
};

interface LessonCounts {
  completed: number;
  total: number;
}

function learnHref(enrollment: Enrollment): string {
  const base = `/learner/courses/${enrollment.courseId}/learn`;
  return enrollment.batchId ? `${base}?batchId=${enrollment.batchId}` : base;
}

type CardAction =
  | { label: string; kind: "learn" }
  | { label: string; kind: "checkout" }
  | { label: string; kind: "waiting" };

function getCardAction(enr: Enrollment, orderMap: Map<string, Order>): CardAction {
  // Already have access
  if (enr.status === "ACTIVE" || enr.status === "COMPLETED") {
    return {
      label: enr.status === "COMPLETED" ? "Review Course" : "Continue Learning",
      kind: "learn",
    };
  }

  // Find related order
  const key = `${enr.course?.id}::${enr.batch?.id ?? "none"}`;
  const order = orderMap.get(key);

  // No order — free course or edge case
  if (!order) {
    return { label: "Continue Learning", kind: "learn" };
  }

  // Paid & approved (shouldn't happen if enrollment not ACTIVE, but just in case)
  if (order.status === "PAID") {
    return { label: "Continue Learning", kind: "learn" };
  }

  // Failed/rejected
  if (order.status === "FAILED" || order.status === "REFUNDED") {
    return { label: "Try Again", kind: "checkout" };
  }

  // PENDING with transactionId → waiting for admin
  if (order.transactionId) {
    return { label: "⏳ Waiting for Verification", kind: "waiting" };
  }

  // PENDING without transaction → needs to pay
  return { label: "Complete Payment", kind: "checkout" };
}

export default function MyCoursesPage() {
  const { user } = useAuth();
  const learnerId = user?.id ?? "";
  const [filter, setFilter] = useState<FilterKey>("all");

  const enrollmentsQuery = useQuery({
    queryKey: ["enrollments", "my", learnerId],
    enabled: Boolean(learnerId),
    queryFn: async () =>
      (await apiFetch<EnrollmentListData>(`/enrollments/my/${learnerId}`)).data,
  });

  const enrollments = useMemo(
    () => enrollmentsQuery.data?.enrollments ?? [],
    [enrollmentsQuery.data]
  );

  const paymentsQuery = useQuery({
    queryKey: ["payments", "my", learnerId],
    enabled: Boolean(learnerId),
    queryFn: async () =>
      (await apiFetch<OrderListData>(`/payments/my/${learnerId}`)).data,
  });

  const orders = useMemo(
    () => paymentsQuery.data?.orders ?? [],
    [paymentsQuery.data]
  );

  const orderMap = useMemo(() => {
    const map = new Map<string, Order>();
    orders.forEach((order) => {
      const key = `${order.courseId}::${order.batchId ?? "none"}`;
      const existing = map.get(key);
      if (
        !existing ||
        new Date(order.createdAt) > new Date(existing.createdAt)
      ) {
        map.set(key, order);
      }
    });
    return map;
  }, [orders]);

  const progressQueries = useQueries({
    queries: enrollments.map((enrollment) => ({
      queryKey: [
        "progress",
        learnerId,
        enrollment.courseId,
        enrollment.batchId ?? "",
      ],
      enabled: Boolean(learnerId) && Boolean(enrollment.courseId),
      queryFn: async () =>
        (
          await apiFetch<CourseProgressData>(
            `/progress/my/${learnerId}/course/${enrollment.courseId}${
              enrollment.batchId ? `?batchId=${enrollment.batchId}` : ""
            }`
          )
        ).data,
    })),
  });

  const countsByCourse = useMemo(() => {
    const map = new Map<string, LessonCounts>();
    enrollments.forEach((enrollment, index) => {
      const data = progressQueries[index]?.data;
      const lessons = data?.modules.flatMap((module) => module.lessons) ?? [];
      map.set(enrollment.id, {
        completed: lessons.filter((lesson) => lesson.progress?.isCompleted).length,
        total: lessons.length,
      });
    });
    return map;
  }, [enrollments, progressQueries]);

  const filtered = useMemo(() => {
    const matcher = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];
    return enrollments.filter(matcher.match);
  }, [enrollments, filter]);

  if (enrollmentsQuery.isLoading || paymentsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-8 w-44" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-36" />
        </div>
        <Skeleton className="h-10 w-80 max-w-full rounded-lg" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-72 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (enrollmentsQuery.isError) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed p-12 text-center">
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <BookOpen className="size-6" />
        </span>
        <div>
          <p className="font-semibold">Couldn&apos;t load your courses</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {enrollmentsQuery.error instanceof Error
              ? enrollmentsQuery.error.message
              : "Please try again."}
          </p>
        </div>
        <Button variant="outline" onClick={() => enrollmentsQuery.refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const emptyCopy = EMPTY_COPY[filter];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Courses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Continue learning where you left off.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/courses" />}>
          Browse Courses
          <ArrowRight className="size-4" />
        </Button>
      </div>

      <Tabs value={filter} onValueChange={(value) => setFilter(value as FilterKey)}>
        <TabsList className="w-full justify-start sm:w-auto">
          {FILTERS.map((item) => (
            <TabsTrigger key={item.key} value={item.key}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-muted/30 p-12 text-center">
          <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BookOpen className="size-7" />
          </span>
          <div>
            <h3 className="font-semibold">{emptyCopy.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{emptyCopy.subtitle}</p>
          </div>
          <Button className="mt-2" nativeButton={false} render={<Link href="/courses" />}>
            Browse Courses
            <ArrowRight className="size-4" />
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((enrollment) => (
            <EnrollmentCard
              key={enrollment.id}
              enrollment={enrollment}
              counts={countsByCourse.get(enrollment.id)}
              orderMap={orderMap}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EnrollmentCard({
  enrollment,
  counts,
  orderMap,
}: {
  enrollment: Enrollment;
  counts?: LessonCounts;
  orderMap: Map<string, Order>;
}) {
  const router = useRouter();
  const isBatch =
    enrollment.course?.courseType === "BATCH" || Boolean(enrollment.batch);
  const badgeLabel = isBatch
    ? `Batch ${enrollment.batch?.batchNumber ?? ""}`
    : "Self-Paced";
  const pending = enrollment.status === "PENDING";
  const level = enrollment.course?.level ?? "BEGINNER";
  const action = getCardAction(enrollment, orderMap);

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-video w-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        {enrollment.course?.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={enrollment.course.thumbnail}
            alt={enrollment.course.title}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <GraduationCap className="size-12 text-white/70" />
          </div>
        )}
        <Badge className="absolute left-2 top-2 bg-white/90 text-indigo-700">
          {badgeLabel}
        </Badge>
      </div>

      <CardContent className="flex flex-1 flex-col gap-3">
        <span
          className={cn(
            "w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold",
            LEVEL_BADGE_CLASS[level]
          )}
        >
          {level}
        </span>

        <p className="line-clamp-2 font-semibold leading-snug">
          {enrollment.course?.title ?? "Untitled course"}
        </p>

        <div className="mt-auto space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{enrollment.progress}% complete</span>
            {counts && counts.total > 0 ? (
              <span className="font-medium text-slate-600">
                {counts.completed} of {counts.total} lessons
              </span>
            ) : (
              <span className="font-medium text-slate-600">
                {pending
                  ? "Awaiting payment"
                  : enrollment.status === "COMPLETED"
                    ? "Completed"
                    : "In progress"}
              </span>
            )}
          </div>
          <Progress value={enrollment.progress} className="h-2" />

          {action.kind === "learn" && (
            <Button
              className="mt-1 w-full"
              onClick={() => router.push(learnHref(enrollment))}
            >
              {action.label}
              <ArrowRight className="size-4" />
            </Button>
          )}

          {action.kind === "checkout" && (
            <Button
              className="mt-1 w-full"
              onClick={() => router.push(`/checkout/${enrollment.id}`)}
            >
              {action.label}
              <ArrowRight className="size-4" />
            </Button>
          )}

          {action.kind === "waiting" && (
            <Button
              variant="outline"
              disabled
              className="mt-1 w-full cursor-not-allowed border-amber-300 bg-amber-50 text-amber-800"
            >
              <Clock className="size-4 mr-2" />
              {action.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
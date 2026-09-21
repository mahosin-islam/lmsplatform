"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  XCircle,
} from "lucide-react";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatPrice } from "@/lib/course-utils";
import type { Enrollment, OrderListData } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PaymentStatusPage() {
  const params = useParams<{ enrollmentId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const enrollmentId = params?.enrollmentId ?? "";

  const enrollmentQuery = useQuery({
    queryKey: ["enrollment", enrollmentId],
    enabled: Boolean(enrollmentId),
    queryFn: async () =>
      (await apiFetch<Enrollment>(`/enrollments/${enrollmentId}`)).data,
  });

  const paymentsQuery = useQuery({
    queryKey: ["payments", "my"],
    enabled: Boolean(user?.id),
    queryFn: async () =>
      (await apiFetch<OrderListData>(`/payments/my/${user!.id}`)).data,
  });

  const enrollment = enrollmentQuery.data;

  const order = React.useMemo(() => {
    if (!enrollment) return undefined;
    const orders = paymentsQuery.data?.orders ?? [];
    const match = orders.filter(
      (item) =>
        item.courseId === enrollment.courseId &&
        (item.batchId ?? null) === (enrollment.batchId ?? null)
    );
    return match.find((item) => item.status === "PENDING") ?? match[0];
  }, [enrollment, paymentsQuery.data]);

  if (enrollmentQuery.isLoading || paymentsQuery.isLoading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
        <Skeleton className="mx-auto size-16 rounded-full" />
        <Skeleton className="mx-auto mt-6 h-6 w-2/3" />
        <Skeleton className="mx-auto mt-2 h-4 w-1/2" />
      </div>
    );
  }

  if (enrollmentQuery.isError || !enrollment) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
        <span className="inline-flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="size-7" />
        </span>
        <h1 className="mt-5 text-xl font-bold">Payment status unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We couldn&apos;t find this enrollment. Check the link or contact
          admin.
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => router.replace("/learner/payments")}
        >
          View Payment History
        </Button>
      </div>
    );
  }

  const status = enrollment.status;
  const course = enrollment.course;
  const amount = course?.price ?? 0;

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      {status === "ACTIVE" ? (
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="size-9" />
          </span>
          <h1 className="mt-5 text-2xl font-bold tracking-tight">
            Payment Confirmed!
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your payment of {formatPrice(amount)} has been verified and
            {course?.title ? ` ${course.title}` : " the course"} is now
            available.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              nativeButton={false}
              render={
                <Link
                  href={
                    course?.slug
                      ? `/courses/${course.slug}`
                      : "/learner/courses"
                  }
                />
              }
            >
              Go to Course
            </Button>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/learner/dashboard" />}
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      ) : status === "CANCELLED" ? (
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex size-16 items-center justify-center rounded-full bg-red-100 text-red-600">
            <XCircle className="size-9" />
          </span>
          <h1 className="mt-5 text-2xl font-bold tracking-tight">
            Payment Rejected
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We couldn&apos;t verify your payment for{" "}
            {course?.title ?? "this course"}. Please check the transaction
            details or contact admin for help.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {course?.slug ? (
              <Button
                nativeButton={false}
                render={<Link href={`/courses/${course.slug}`} />}
              >
                Retry Enrollment
              </Button>
            ) : null}
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/learner/payments" />}
            >
              Payment History
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex size-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <Clock className="size-9" />
          </span>
          <h1 className="mt-5 text-2xl font-bold tracking-tight">
            Waiting for Verification
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your payment is being reviewed by admin. This usually takes up to
            24 hours. You&apos;ll get a notification once it&apos;s verified.
          </p>
          <Card className="mt-8 w-full max-w-sm text-left">
            <CardContent className="space-y-2 p-5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Course</span>
                <span className="truncate pl-4 font-medium">
                  {course?.title ?? "\u2014"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold tabular-nums">
                  {formatPrice(amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transaction ID</span>
                <span className="truncate pl-4 font-mono text-xs font-semibold">
                  {order?.transactionId ?? "\u2014"}
                </span>
              </div>
            </CardContent>
          </Card>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              nativeButton={false}
              render={<Link href={`/checkout/${enrollmentId}`} />}
            >
              Continue Payment
            </Button>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/learner/payments" />}
            >
              Payment History
            </Button>
          </div>
        </div>
      )}

      <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <Loader2 className="size-3.5" />
        This page auto-refreshes while your payment is pending.
      </p>
    </div>
  );
}
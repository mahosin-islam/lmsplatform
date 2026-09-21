"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, Loader2, Wallet } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatPrice } from "@/lib/course-utils";
import type { Enrollment, Order, OrderListData } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function orderLabel(order: Order | undefined): string {
  return order ? (order.status === "PENDING" ? "⏳ Pending Verification" : order.status) : "⏳ Pending Verification";
}

export default function PaymentSuccessPage() {
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

  const notifiedRef = React.useRef(false);

  // Poll the enrollment every 30s and bail once it becomes ACTIVE.
  React.useEffect(() => {
    const poll = window.setInterval(() => {
      enrollmentQuery.refetch();
      paymentsQuery.refetch();
    }, 30_000);
    return () => window.clearInterval(poll);
  }, [enrollmentQuery, paymentsQuery]);

  React.useEffect(() => {
    if (enrollment?.status === "ACTIVE" && !notifiedRef.current) {
      notifiedRef.current = true;
      toast.success("Payment verified! Your course is now available.");
      const slug = enrollment.course?.slug;
      router.replace(slug ? `/courses/${slug}` : "/learner/courses");
    }
  }, [enrollment, router]);

  const loading = enrollmentQuery.isLoading || paymentsQuery.isLoading;

  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
        <Skeleton className="mx-auto size-16 rounded-full" />
        <Skeleton className="mx-auto mt-6 h-6 w-2/3" />
        <Skeleton className="mx-auto mt-2 h-4 w-1/2" />
        <Skeleton className="mt-8 h-40 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <div className="flex flex-col items-center text-center">
        <span className="inline-flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="size-9" />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">
          Payment Submitted Successfully!
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your payment is being verified by our admin
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          This usually takes up to 24 hours
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          You will receive a notification once verified
        </p>
      </div>

      <Card className="mt-8">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Wallet className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold">
                {enrollment?.course?.title ?? "Course"}
              </p>
              <p className="text-xs text-muted-foreground">
                {enrollment?.batch
                  ? `Batch ${enrollment.batch.batchNumber}`
                  : "Self-paced course"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 border-t pt-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="mt-0.5 font-bold tabular-nums">
                {formatPrice(enrollment?.course?.price ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Transaction ID</p>
              <p className="mt-0.5 truncate font-mono text-xs font-semibold">
                {order?.transactionId ?? "\u2014"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="mt-0.5 inline-flex items-center gap-1 font-semibold text-amber-600">
                <Clock className="size-3.5" />
                {orderLabel(order)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Button
          nativeButton={false}
          render={<Link href="/learner/dashboard" />}
        >
          Go to Dashboard
        </Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/learner/payments" />}
        >
          View Payment History
        </Button>
      </div>

      <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <Clock className="size-3.5" />
        Auto-refreshing — this page updates itself every 30 seconds.
      </p>
    </div>
  );
}
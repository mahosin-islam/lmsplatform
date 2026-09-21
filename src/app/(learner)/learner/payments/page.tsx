"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  Key,
  Loader2,
  RefreshCcw,
  Smartphone,
  Wallet,
  XCircle,
} from "lucide-react";
import { cn } from "cn";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  copyToClipboard,
  formatDate,
  formatPrice,
} from "@/lib/course-utils";
import { PaymentDetailDialog } from "@/components/learner/PaymentDetailDialog";
import type {
  Enrollment,
  EnrollmentListData,
  Order,
  OrderListData,
  PaymentProvider,
  PaymentStatus,
} from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TabKey = "all" | "paid" | "pending" | "failed";

const TAB_LABEL: Record<TabKey, string> = {
  all: "All",
  paid: "Paid",
  pending: "Pending",
  failed: "Failed",
};

const TAB_FILTER: Record<TabKey, PaymentStatus | null> = {
  all: null,
  paid: "PAID",
  pending: "PENDING",
  failed: "FAILED",
};

const STATUS_META: Record<
  PaymentStatus,
  { label: string; badge: string; card: string }
> = {
  PENDING: {
    label: "Pending",
    badge: "bg-amber-100 text-amber-700",
    card: "border-l-4 border-l-amber-500 bg-amber-50/70",
  },
  PAID: {
    label: "Paid",
    badge: "bg-emerald-100 text-emerald-700",
    card: "border-l-4 border-l-emerald-500 bg-emerald-50/70",
  },
  FAILED: {
    label: "Failed",
    badge: "bg-red-100 text-red-700",
    card: "border-l-4 border-l-red-500 bg-red-50/70",
  },
  REFUNDED: {
    label: "Refunded",
    badge: "bg-slate-200 text-slate-600",
    card: "border-l-4 border-l-slate-500 bg-slate-50/70",
  },
};

const PROVIDER_META: Record<PaymentProvider, { label: string; badge: string }> = {
  BKASH: { label: "bKash", badge: "bg-pink-100 text-pink-700" },
  NAGAD: { label: "Nagad", badge: "bg-orange-100 text-orange-700" },
  FREE: { label: "Free", badge: "bg-emerald-100 text-emerald-700" },
};

const STAT_CARDS: Array<{
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  getValue: (stats: {
    totalSpent: number;
    paid: number;
    pending: number;
    failed: number;
  }) => string;
}> = [
  {
    key: "total",
    label: "Total Spent",
    icon: Wallet,
    iconBg: "bg-emerald-500",
    getValue: (stats) => formatPrice(stats.totalSpent),
  },
  {
    key: "paid",
    label: "Successful",
    icon: CheckCircle2,
    iconBg: "bg-blue-500",
    getValue: (stats) => String(stats.paid),
  },
  {
    key: "pending",
    label: "Pending",
    icon: Clock,
    iconBg: "bg-amber-500",
    getValue: (stats) => String(stats.pending),
  },
  {
    key: "failed",
    label: "Failed",
    icon: XCircle,
    iconBg: "bg-red-500",
    getValue: (stats) => String(stats.failed),
  },
];

function enrollmentKey(courseId: string, batchId: string | null): string {
  return `${courseId}:${batchId ?? "none"}`;
}

async function copyText(value: string): Promise<void> {
  const ok = await copyToClipboard(value);
  if (ok) toast.success("Copied!");
  else toast.error("Could not copy");
}

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

function PaymentRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="ml-auto text-right font-medium">{children}</span>
    </div>
  );
}

function LearnerPaymentsContent() {
  const { user } = useAuth();
  const learnerId = user?.id ?? "";
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = React.useState<Order | null>(null);

  const paymentsQuery = useQuery({
    queryKey: ["payments", "my", learnerId],
    enabled: Boolean(learnerId),
    queryFn: async () =>
      (await apiFetch<OrderListData>(`/payments/my/${learnerId}`)).data,
  });

  const enrollmentsQuery = useQuery({
    queryKey: ["enrollments", "my", learnerId],
    enabled: Boolean(learnerId),
    queryFn: async () =>
      (await apiFetch<EnrollmentListData>(`/enrollments/my/${learnerId}`))
        .data,
  });

  const enrollments = React.useMemo(
    () => enrollmentsQuery.data?.enrollments ?? [],
    [enrollmentsQuery.data]
  );
  const enrollmentMap = React.useMemo(() => {
    const map = new Map<string, Enrollment>();
    for (const enrollment of enrollments) {
      map.set(
        enrollmentKey(enrollment.courseId, enrollment.batchId),
        enrollment
      );
    }
    return map;
  }, [enrollments]);

  const orders = React.useMemo(
    () => paymentsQuery.data?.orders ?? [],
    [paymentsQuery.data]
  );

  const stats = React.useMemo(() => {
    let totalSpent = 0;
    let paid = 0;
    let pending = 0;
    let failed = 0;
    for (const order of orders) {
      if (order.status === "PAID") {
        totalSpent += order.amount || 0;
        paid += 1;
      } else if (order.status === "PENDING") {
        pending += 1;
      } else if (order.status === "FAILED") {
        failed += 1;
      }
    }
    return { totalSpent, paid, pending, failed };
  }, [orders]);

  const tabFromUrl = searchParams.get("status")?.toUpperCase() as
    | PaymentStatus
    | null;
  const initialTab: TabKey = tabFromUrl
    ? (Object.keys(TAB_FILTER) as TabKey[]).find(
        (key) => TAB_FILTER[key] === tabFromUrl
      ) ?? "all"
    : "all";

  const [activeTab, setActiveTab] = React.useState<TabKey>(initialTab);

  const handleTabChange = (value: string): void => {
    const tab = value as TabKey;
    setActiveTab(tab);
    const filter = TAB_FILTER[tab];
    if (filter) {
      router.replace(`/learner/payments?status=${filter}`, { scroll: false });
    } else {
      router.replace("/learner/payments", { scroll: false });
    }
  };

  const visibleOrders =
    activeTab === "all"
      ? orders
      : orders.filter((order) => order.status === TAB_FILTER[activeTab]);

  const countFor = (tab: TabKey): number => {
    const filter = TAB_FILTER[tab];
    if (!filter) return orders.length;
    return orders.filter((order) => order.status === filter).length;
  };

  if (paymentsQuery.isLoading || enrollmentsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (paymentsQuery.isError) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center">
        <p className="font-medium">Couldn&apos;t load your payments</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {paymentsQuery.error instanceof Error
            ? paymentsQuery.error.message
            : "Please try again."}
        </p>
        <Button className="mt-4" onClick={() => paymentsQuery.refetch()}>
          <RefreshCcw className="size-4" />
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PaymentDetailDialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        order={selected}
        enrollmentId={
          selected
            ? enrollmentMap.get(
                enrollmentKey(selected.courseId, selected.batchId)
              )?.id
            : null
        }
      />

      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Payments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your enrollment payments and complete pending ones
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map((card) => (
          <StatCard
            key={card.key}
            icon={card.icon}
            value={card.getValue(stats)}
            label={card.label}
            iconBg={card.iconBg}
          />
        ))}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <div className="overflow-x-auto pb-1">
          <TabsList className="w-fit">
            {(Object.keys(TAB_LABEL) as TabKey[]).map((tab) => (
              <TabsTrigger key={tab} value={tab}>
                {TAB_LABEL[tab]}
                <span className="ml-1 rounded-full bg-muted-foreground/10 px-1.5 text-xs font-semibold tabular-nums">
                  {countFor(tab)}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <span className="inline-flex size-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <CreditCard className="size-7" />
          </span>
          <p className="mt-4 font-medium">No payments yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your payment history will appear here once you enroll in a paid
            course.
          </p>
          <Button
            className="mt-5"
            nativeButton={false}
            render={<Link href="/learner/courses" />}
          >
            Browse Courses
          </Button>
        </div>
      ) : visibleOrders.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="font-medium">No {TAB_LABEL[activeTab].toLowerCase()} payments</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Payments in this state will show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleOrders.map((order) => {
            const meta = STATUS_META[order.status];
            const provider =
              PROVIDER_META[order.provider] ?? PROVIDER_META.FREE;
            const enrollment = enrollmentMap.get(
              enrollmentKey(order.courseId, order.batchId)
            );
            const isPending = order.status === "PENDING";
            const hasSubmittedInfo = Boolean(
              order.transactionId || order.senderNumber
            );

            return (
              <Card
                key={order.id}
                className={cn("shadow-sm", meta.card)}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    {order.course?.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={order.course.thumbnail}
                        alt={order.course.title ?? "Course"}
                        className="size-12 shrink-0 rounded-lg border object-cover"
                      />
                    ) : (
                      <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                        <CreditCard className="size-5" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {order.course?.title ?? "Course"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.batch
                          ? `Batch ${order.batch.batchNumber} (${order.batch.title})`
                          : "Self-paced"}
                      </p>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Wallet className="size-4 shrink-0 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Amount
                      </span>
                      <span className="ml-auto text-lg font-bold tabular-nums">
                        {formatPrice(order.amount)}
                      </span>
                    </div>
                    <PaymentRow icon={Smartphone} label="Provider">
                      <Badge
                        variant="secondary"
                        className={cn("font-medium", provider.badge)}
                      >
                        {provider.label}
                      </Badge>
                    </PaymentRow>
                    <PaymentRow icon={Key} label="TrxID">
                      {order.transactionId ? (
                        <button
                          type="button"
                          onClick={() => void copyText(order.transactionId!)}
                          className="inline-flex items-center gap-1 font-mono text-xs font-semibold hover:underline"
                        >
                          {order.transactionId}
                          <Copy className="size-3.5" />
                        </button>
                      ) : (
                        <span className="text-muted-foreground">\u2014</span>
                      )}
                    </PaymentRow>
                    <PaymentRow
                      icon={Calendar}
                      label={isPending ? "Created" : "Paid"}
                    >
                      {formatDate(
                        isPending ? order.createdAt : order.updatedAt
                      )}
                    </PaymentRow>
                  </div>

                  <Separator className="my-4" />

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Badge
                      variant="secondary"
                      className={cn("font-medium", meta.badge)}
                    >
                      {meta.label}
                    </Badge>

                    {isPending && !hasSubmittedInfo ? (
                      enrollment ? (
                        <Button
                          size="sm"
                          nativeButton={false}
                          render={
                            <Link href={`/checkout/${enrollment.id}`}>
                              <ExternalLink className="size-4" />
                              Complete Payment
                            </Link>
                          }
                        />
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          nativeButton={false}
                          render={
                            <Link
                              href={`/courses/${order.course?.slug ?? ""}`}
                            >
                              View Course
                            </Link>
                          }
                        />
                      )
                    ) : isPending && hasSubmittedInfo ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
                        <Clock className="size-3.5" />
                        Waiting for admin approval
                      </span>
                    ) : order.status === "FAILED" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        nativeButton={false}
                        render={
                          <Link href={`/courses/${order.course?.slug ?? ""}`}>
                            <RefreshCcw className="size-4" />
                            Try Again
                          </Link>
                        }
                      />
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelected(order)}
                      >
                        View Details
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <p className="flex items-center gap-1.5 text-center text-xs text-muted-foreground">
        <Loader2 className="size-3.5" />
        For any payment issue, contact admin.
      </p>
    </div>
  );
}

export default function LearnerPaymentsPage() {
  return (
    <div className="space-y-6">
      <LearnerPaymentsContent />
    </div>
  );
}
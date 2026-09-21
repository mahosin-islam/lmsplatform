"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertCircle,
  Banknote,
  BookOpen,
  CheckCircle2,
  Clock3,
  Copy,
  Filter,
  GraduationCap,
  Loader2,
  RefreshCw,
  X,
  XCircle,
} from "lucide-react";
import { cn } from "cn";

import { apiFetch } from "@/lib/api";
import {
  copyToClipboard,
  formatPrice,
  shortenTx,
  timeAgo,
} from "@/lib/course-utils";
import {
  ORDER_BADGE,
  PROVIDER_BADGE,
  PROVIDER_LABEL,
} from "@/lib/payment-utils";
import type {
  BatchListData,
  CourseListData,
  Order,
  OrderListData,
  PaymentStats,
  PaymentStatus,
} from "@/types";
import { PaymentDetailDialog } from "@/components/admin/PaymentDetailDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type TabValue = "pending" | "all";
type VerifyAction = "APPROVE" | "REJECT";

const STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

function getUserInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase() || "?";
}

function copyText(text: string, label: string): void {
  void copyToClipboard(text).then((ok) => {
    if (ok) toast.success(`${label} copied to clipboard`);
    else toast.error("Could not copy to clipboard");
  });
}

function OrdersTable({
  orders,
  onSelect,
  onApprove,
  onReject,
}: {
  orders: Order[];
  onSelect: (order: Order) => void;
  onApprove: (order: Order) => void;
  onReject: (order: Order) => void;
}) {
  return (
    <Card className="overflow-hidden p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow
              key={order.id}
              className="cursor-pointer"
              onClick={() => onSelect(order)}
            >
              <TableCell className="max-w-[220px]">
                <div className="flex items-center gap-3">
                  <Avatar className="size-9">
                    {order.learner?.avatar ? (
                      <AvatarImage
                        src={order.learner.avatar}
                        alt={order.learner?.name ?? "Student"}
                      />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                      {getUserInitials(order.learner?.name ?? "?")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {order.learner?.name ?? "Unknown"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {order.learner?.email}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="max-w-[200px]">
                <p className="truncate">{order.course?.title ?? "Course"}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {order.provider ? (
                    <Badge
                      variant="secondary"
                      className={PROVIDER_BADGE[order.provider]}
                    >
                      {PROVIDER_LABEL[order.provider]}
                    </Badge>
                  ) : null}
                  {order.batch ? (
                    <span className="text-xs text-muted-foreground">
                      Batch {order.batch.batchNumber}
                    </span>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap font-bold tabular-nums">
                {formatPrice(order.amount)}
              </TableCell>
              <TableCell>
                {order.transactionId ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      copyText(order.transactionId ?? "", "TrxID");
                    }}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    title={order.transactionId ?? undefined}
                  >
                    <Copy className="size-3" />
                    {shortenTx(order.transactionId)}
                  </button>
                ) : (
                  <Badge
                    variant="secondary"
                    className={cn("font-medium", ORDER_BADGE[order.status])}
                  >
                    {STATUS_LABEL[order.status]}
                  </Badge>
                )}
                {order.senderNumber ? (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {order.senderNumber}
                  </p>
                ) : null}
              </TableCell>
              <TableCell className="hidden whitespace-nowrap text-muted-foreground md:table-cell">
                {timeAgo(order.updatedAt ?? order.createdAt)}
              </TableCell>
              <TableCell>
                {order.status === "PENDING" ? (
                  <div
                    className="flex items-center justify-end gap-2"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Button
                      variant="outline"
                      size="xs"
                      className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
                      onClick={() => onApprove(order)}
                    >
                      <CheckCircle2 className="size-3.5" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="xs"
                      className="border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                      onClick={() => onReject(order)}
                    >
                      <XCircle className="size-3.5" />
                      Reject
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => onSelect(order)}
                    >
                      View
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function OrdersTableSkeleton() {
  return (
    <Card className="overflow-hidden p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Skeleton className="size-9 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-3.5 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Skeleton className="h-3.5 w-24" />
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2">
                  <Skeleton className="h-7 w-20" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function PaymentsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const rawTab = searchParams.get("tab") ?? "pending";
  const tab: TabValue = rawTab === "all" ? "all" : "pending";

  const [selectedCourseId, setSelectedCourseId] = React.useState("all");
  const [selectedBatchId, setSelectedBatchId] = React.useState("all");
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);
  const [verifyTarget, setVerifyTarget] = React.useState<{
    order: Order;
    action: VerifyAction;
  } | null>(null);
  const [note, setNote] = React.useState("");

  const coursesQuery = useQuery({
    queryKey: ["courses", "for-payments-filter"],
    queryFn: async () => (await apiFetch<CourseListData>("/courses")).data,
    staleTime: 3 * 60 * 1000,
  });

  const courses = coursesQuery.data?.courses ?? [];
  const selectedCourse = courses.find(
    (course) => course.id === selectedCourseId
  );
  const isBatchCourse = selectedCourse?.courseType === "BATCH";

  const batchesQuery = useQuery({
    queryKey: ["batches", "for-payments-filter", selectedCourseId],
    enabled: selectedCourseId !== "all" && isBatchCourse,
    queryFn: async () =>
      (await apiFetch<BatchListData>(`/batches/course/${selectedCourseId}`))
        .data,
    staleTime: 3 * 60 * 1000,
  });

  const batches = batchesQuery.data?.batches ?? [];
  const selectedBatch = batches.find((batch) => batch.id === selectedBatchId);

  // Reset batch filter whenever the course changes.
  React.useEffect(() => {
    setSelectedBatchId("all");
  }, [selectedCourseId]);

  const filterQuery = React.useMemo(() => {
    const params = new URLSearchParams();
    if (selectedCourseId !== "all") params.set("courseId", selectedCourseId);
    if (selectedBatchId !== "all") params.set("batchId", selectedBatchId);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }, [selectedCourseId, selectedBatchId]);

  const statsQuery = useQuery({
    queryKey: ["payment-stats", selectedCourseId, selectedBatchId],
    queryFn: async () =>
      (await apiFetch<PaymentStats>(`/payments/stats/all${filterQuery}`)).data,
  });

  const paymentsQuery = useQuery({
    queryKey: ["payments-all", selectedCourseId, selectedBatchId],
    queryFn: async () =>
      (await apiFetch<OrderListData>(`/payments/all${filterQuery}`)).data,
    staleTime: 10 * 1000,
  });

  const allOrders = paymentsQuery.data?.orders ?? [];

  const pendingOrders = React.useMemo(
    () => (paymentsQuery.data?.orders ?? []).filter((order) => order.status === "PENDING"),
    [paymentsQuery.data]
  );

  const verifyMutation = useMutation({
    mutationFn: async ({
      id,
      action,
      reason,
    }: {
      id: string;
      action: VerifyAction;
      reason?: string;
    }) =>
      apiFetch(`/payments/${id}/verify`, {
        method: "PATCH",
        body: { action, note: reason || undefined },
      }),
    onSuccess: (_data, variables) => {
      toast.success(
        variables.action === "APPROVE"
          ? "Payment approved — enrollment is now active"
          : "Payment rejected — enrollment cancelled"
      );
      queryClient.invalidateQueries({ queryKey: ["payment-stats"] });
      queryClient.invalidateQueries({ queryKey: ["payments-all"] });
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      setVerifyTarget(null);
      setNote("");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not verify payment"
      );
    },
  });

  const changeTab = (next: TabValue) => {
    router.replace(`${pathname}?tab=${next}`, { scroll: false });
  };

  const requestVerify = (order: Order, action: VerifyAction) => {
    setSelectedOrder(null);
    setNote("");
    setVerifyTarget({ order, action });
  };

  const confirmVerify = () => {
    if (!verifyTarget) return;
    if (verifyTarget.action === "REJECT" && !note.trim()) {
      toast.error("A note is required when rejecting a payment");
      return;
    }
    verifyMutation.mutate({
      id: verifyTarget.order.id,
      action: verifyTarget.action,
      reason: note.trim() || undefined,
    });
  };

  const clearFilters = () => {
    setSelectedCourseId("all");
    setSelectedBatchId("all");
  };

  const isFiltered = selectedCourseId !== "all" || selectedBatchId !== "all";

  const batchLabel = selectedBatch
    ? `${selectedBatch.title ?? `Batch ${selectedBatch.batchNumber}`}`
    : "";
  const filterDescription = isFiltered
    ? `${selectedCourse?.title ?? "Course"}${selectedBatchId !== "all" && batchLabel ? ` · ${batchLabel}` : ""}`
    : "";

  const stats = statsQuery.data;
  const showStatsSkeleton = statsQuery.isLoading;

  const statCards = [
    {
      label: "Total Revenue",
      value: stats ? formatPrice(stats.totalEarning) : "—",
      icon: Banknote,
      tint: "bg-emerald-100 text-emerald-600",
    },
    {
      label: "Pending",
      value: stats ? stats.pendingPayments : "—",
      icon: Clock3,
      tint: "bg-amber-100 text-amber-600",
    },
    {
      label: "Successful",
      value: stats ? stats.successfulPayments : "—",
      icon: CheckCircle2,
      tint: "bg-blue-100 text-blue-600",
    },
    {
      label: "Failed",
      value: stats ? stats.failedPayments : "—",
      icon: XCircle,
      tint: "bg-red-100 text-red-600",
    },
  ];

  const isRefreshing =
    paymentsQuery.isLoading ||
    paymentsQuery.isFetching ||
    statsQuery.isFetching;

  const refresh = async () => {
    await Promise.all([
      queryClient.refetchQueries({ queryKey: ["payment-stats"] }),
      queryClient.refetchQueries({ queryKey: ["payments-all"] }),
      queryClient.refetchQueries({ queryKey: ["courses"] }),
      queryClient.refetchQueries({ queryKey: ["batches"] }),
    ]);
  };

  const qualification = `${
    selectedCourse?.title ?? "Course"
  }${
    selectedBatchId !== "all" && batchLabel ? ` · ${batchLabel}` : ""
  }`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Payment Approvals
          </h1>
          <p className="text-sm text-muted-foreground">
            Verify learner payments and manage the payment history.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={cn("size-4", isRefreshing && "animate-spin")}
            />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="grid gap-2">
            <Label htmlFor="course-filter" className="text-xs font-medium">
              Course
            </Label>
            <Select
              value={selectedCourseId}
              onValueChange={(value) => setSelectedCourseId(value ?? "all")}
            >
              <SelectTrigger id="course-filter" className="min-w-[200px]">
                <SelectValue>
                  {(value) => (
                    <span className="flex items-center gap-2">
                      <BookOpen className="size-4 text-muted-foreground" />
                      {courses.find((course) => course.id === value)?.title ??
                        "All Courses"}
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    <span className="flex items-center justify-between gap-2">
                      {course.title}
                      <Badge variant="outline" className="text-[10px]">
                        {course.courseType}
                      </Badge>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="batch-filter" className="text-xs font-medium">
              Batch
            </Label>
            <Select
              value={selectedBatchId}
              disabled={selectedCourseId === "all" || !isBatchCourse}
              onValueChange={(value) => setSelectedBatchId(value ?? "all")}
            >
              <SelectTrigger id="batch-filter" className="min-w-[180px]">
                <SelectValue>
                  {(value) => (
                    <span className="flex items-center gap-2">
                      <GraduationCap className="size-4 text-muted-foreground" />
                      {selectedCourseId === "all" || !isBatchCourse
                        ? "All Batches"
                        : batches.find((batch) => batch.id === value)
                          ? `Batch ${batches.find((batch) => batch.id === value)?.batchNumber}`
                          : "All Batches"}
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Batches</SelectItem>
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id}>
                    <span className="flex items-center gap-2">
                      Batch {batch.batchNumber}
                      {batch.title ? (
                        <span className="text-muted-foreground">
                          {batch.title}
                        </span>
                      ) : null}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isFiltered ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={clearFilters}
            >
              <X className="size-4" />
              Clear
            </Button>
          ) : null}
        </div>
      </Card>

      <div>
        {showStatsSkeleton ? (
          <Card className="p-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-lg" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="p-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {statCards.map((card) => (
                <div key={card.label} className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex size-10 items-center justify-center rounded-lg",
                      card.tint
                    )}
                  >
                    <card.icon className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {card.label}
                    </p>
                    <p className="text-lg font-bold tabular-nums leading-tight">
                      {card.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {isFiltered ? (
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1.5 px-2.5 py-1">
            <Filter className="size-3.5" />
            Filtered: {filterDescription}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground"
            onClick={clearFilters}
          >
            <X className="size-3.5" />
            Clear
          </Button>
        </div>
      ) : null}

      <Tabs value={tab} onValueChange={(value) => changeTab(value as TabValue)}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingOrders.length})
          </TabsTrigger>
          <TabsTrigger value="all">All ({allOrders.length})</TabsTrigger>
        </TabsList>

        {paymentsQuery.isLoading ? (
          <OrdersTableSkeleton />
        ) : (
          <>
            <TabsContent value="pending" className="space-y-4">
              {pendingOrders.length === 0 ? (
                <Card className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                  <AlertCircle className="size-8 text-muted-foreground" />
                  <p className="font-medium">All caught up</p>
                  <p className="text-sm text-muted-foreground">
                    {isFiltered
                      ? `No pending payments for ${qualification} yet.`
                      : "There are no pending payments to review right now."}
                  </p>
                </Card>
              ) : (
                <OrdersTable
                  orders={pendingOrders}
                  onSelect={setSelectedOrder}
                  onApprove={(order) => requestVerify(order, "APPROVE")}
                  onReject={(order) => requestVerify(order, "REJECT")}
                />
              )}
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              {allOrders.length === 0 ? (
                <Card className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                  <Banknote className="size-8 text-muted-foreground" />
                  <p className="font-medium">
                    {isFiltered ? "No payments found" : "No payments yet"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isFiltered
                      ? `No payments for ${qualification} yet.`
                      : "Payments will appear here once learners submit them."}
                  </p>
                </Card>
              ) : (
                <OrdersTable
                  orders={allOrders}
                  onSelect={setSelectedOrder}
                  onApprove={(order) => requestVerify(order, "APPROVE")}
                  onReject={(order) => requestVerify(order, "REJECT")}
                />
              )}
            </TabsContent>
          </>
        )}
      </Tabs>

      <PaymentDetailDialog
        open={selectedOrder !== null}
        order={selectedOrder}
        onOpenChange={(open) => {
          if (!open) setSelectedOrder(null);
        }}
        onRequestApprove={(order) => requestVerify(order, "APPROVE")}
        onRequestReject={(order) => requestVerify(order, "REJECT")}
      />

      <AlertDialog
        open={verifyTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setVerifyTarget(null);
            setNote("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {verifyTarget?.action === "APPROVE"
                ? "Approve payment"
                : "Reject payment"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {verifyTarget?.action === "APPROVE"
                ? "This will mark the payment as PAID and activate the learner's enrollment."
                : "This will mark the payment as FAILED and cancel the learner's enrollment. A reason is required."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold tabular-nums">
                  {verifyTarget
                    ? formatPrice(verifyTarget.order.amount)
                    : "—"}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-muted-foreground">Student</span>
                <span className="font-medium">
                  {verifyTarget?.order.learner?.name ?? "Unknown"}
                </span>
              </div>
            </div>
            {verifyTarget?.action === "REJECT" ? (
              <div className="grid gap-2">
                <Label htmlFor="reject-note">Reason</Label>
                <Textarea
                  id="reject-note"
                  placeholder="e.g. Invalid transaction ID provided"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={3}
                />
              </div>
            ) : null}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={
                verifyTarget?.action === "REJECT"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : undefined
              }
              onClick={confirmVerify}
              disabled={verifyMutation.isPending}
            >
              {verifyMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              {verifyTarget?.action === "APPROVE" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function PaymentsPage() {
  return <PaymentsContent />;
}
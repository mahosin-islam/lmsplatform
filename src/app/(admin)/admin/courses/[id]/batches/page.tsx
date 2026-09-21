"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Info,
  Loader2,
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Unlock,
  Users,
  Video,
} from "lucide-react";
import { cn } from "cn";

import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/course-utils";
import type { Batch, BatchListData, BatchStatus, Course } from "@/types";
import { BatchFormDialog } from "@/components/course/BatchFormDialog";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type StatusConfig = {
  label: string;
  cardClass: string;
  badgeClass: string;
  iconClass: string;
  icon: React.ComponentType<{ className?: string }>;
};

const STATUS_CONFIG: Record<BatchStatus, StatusConfig> = {
  ACTIVE: {
    label: "ACTIVE",
    cardClass: "border-green-200 bg-green-50",
    badgeClass: "bg-green-100 text-green-700",
    iconClass: "text-green-600",
    icon: Flame,
  },
  UPCOMING: {
    label: "UPCOMING",
    cardClass: "border-amber-200 bg-amber-50",
    badgeClass: "bg-amber-100 text-amber-700",
    iconClass: "text-amber-600",
    icon: Clock,
  },
  COMPLETED: {
    label: "COMPLETED",
    cardClass: "border-gray-200 bg-gray-50",
    badgeClass: "bg-gray-200 text-gray-700",
    iconClass: "text-gray-500",
    icon: CheckCircle2,
  },
};

function BatchCard({
  batch,
  courseSlug,
  onActivate,
  onEdit,
  onDelete,
  onUnlock,
  isActivating,
  isDeleting,
}: {
  batch: Batch;
  courseSlug?: string;
  onActivate: (batch: Batch) => void;
  onEdit: (batch: Batch) => void;
  onDelete: (batch: Batch) => void;
  onUnlock: (batch: Batch) => void;
  isActivating: boolean;
  isDeleting: boolean;
}) {
  const config = STATUS_CONFIG[batch.status];
  const Icon = config.icon;

  return (
    <div className={cn("rounded-xl border p-4 sm:p-5", config.cardClass)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Icon className={cn("size-5 shrink-0", config.iconClass)} />
            <h3 className="font-semibold">Batch {batch.batchNumber}</h3>
            <Badge variant="secondary" className={config.badgeClass}>
              {config.label}
            </Badge>
            {batch.certificateUnlocked ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                <span className="size-1.5 rounded-full bg-green-500" />
                Certificate Ready
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                <Lock className="size-3" />
                Certificate Locked
              </span>
            )}
          </div>

          {batch.title ? (
            <p className="text-sm font-medium text-muted-foreground">
              &ldquo;{batch.title}&rdquo;
            </p>
          ) : null}

          <p className="flex items-center gap-1.5 text-sm">
            <Calendar className="size-4 shrink-0 text-muted-foreground" />
            <span>
              {formatDate(batch.startDate)} &rarr; {formatDate(batch.endDate)}
            </span>
          </p>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="size-4" />
              {batch._count?.enrollments ?? 0} enrolled
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="size-4" />
              {batch._count?.modules ?? 0} modules
            </span>
            <span className="flex items-center gap-1.5">
              <Video className="size-4" />
              {batch._count?.liveSessions ?? 0} live
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:shrink-0 lg:justify-end">
          {batch.certificateUnlocked ? (
            <Badge
              variant="outline"
              className="border-green-300 bg-green-50 text-green-700"
            >
              <CheckCircle2 className="size-3.5 mr-1.5" />
              Certificate Unlocked
            </Badge>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
              onClick={() => onUnlock(batch)}
            >
              <Unlock className="size-4 mr-2" />
              Mark Certificate Unlocked
            </Button>
          )}

          {batch.status !== "ACTIVE" ? (
            <Button
              size="sm"
              className="bg-green-600 text-white hover:bg-green-700"
              onClick={() => onActivate(batch)}
              disabled={isActivating || isDeleting}
            >
              {isActivating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Flame className="size-4" />
              )}
              Activate
            </Button>
          ) : null}

          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(batch)}
            disabled={isActivating || isDeleting}
          >
            <Pencil className="size-4" />
            Edit
          </Button>

          <Button
            size="sm"
            variant="outline"
            disabled={!courseSlug}
            nativeButton={!courseSlug}
            render={courseSlug ? <Link href={`/courses/${courseSlug}`} /> : undefined}
          >
            <BookOpen className="size-4" />
            View Modules
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(batch)}
            disabled={isActivating || isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function BatchManagementPage() {
  const params = useParams<{ id: string }>();
  const courseId = params?.id ?? "";
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingBatch, setEditingBatch] = React.useState<Batch | null>(null);
  const [confirmBatch, setConfirmBatch] = React.useState<Batch | null>(null);

  const bannerStorageKey = `batch-cert-banner-dismissed-${courseId}`;
  const [bannerDismissed, setBannerDismissed] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.sessionStorage.getItem(bannerStorageKey) === "true";
  });

  const dismissBanner = React.useCallback(() => {
    setBannerDismissed(true);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(bannerStorageKey, "true");
    }
  }, [bannerStorageKey]);

  const courseQuery = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => (await apiFetch<Course>(`/courses/${courseId}`)).data,
    enabled: Boolean(courseId),
  });

  const batchesQuery = useQuery({
    queryKey: ["batches", courseId],
    queryFn: async () =>
      (await apiFetch<BatchListData>(`/batches/course/${courseId}`)).data,
    enabled: Boolean(courseId),
  });

  const activateMutation = useMutation({
    mutationFn: async (batch: Batch) => {
      const res = await apiFetch(`/batches/${batch.id}/activate`, {
        method: "PATCH",
      });
      return res;
    },
    onSuccess: (_data, batch) => {
      toast.success(`Batch ${batch.batchNumber} is now active`);
      queryClient.invalidateQueries({ queryKey: ["batches", courseId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "courses"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not activate batch"
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (batch: Batch) => {
      const res = await apiFetch(`/batches/${batch.id}`, { method: "DELETE" });
      return res;
    },
    onSuccess: (_data, batch) => {
      toast.success(`Batch ${batch.batchNumber} deleted`);
      queryClient.invalidateQueries({ queryKey: ["batches", courseId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "courses"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not delete batch"
      );
    },
  });

  const unlockMutation = useMutation({
    mutationFn: (batchId: string) =>
      apiFetch(`/batches/${batchId}/unlock-certificate`, {
        method: "PATCH",
      }),
    onSuccess: (data) => {
      toast.success(data.message || "Certificate unlocked successfully!");
      queryClient.invalidateQueries({ queryKey: ["batches", courseId] });
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      setConfirmBatch(null);
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to unlock certificate"
      );
      setConfirmBatch(null);
    },
  });

  const batches = React.useMemo(() => {
    const list = batchesQuery.data?.batches ?? [];
    return [...list].sort((a, b) => a.batchNumber - b.batchNumber);
  }, [batchesQuery.data]);

  const nextBatchNumber = React.useMemo(() => {
    if (batches.length === 0) return 1;
    return Math.max(...batches.map((batch) => batch.batchNumber)) + 1;
  }, [batches]);

  const course = courseQuery.data;
  const isBatchCourse = course?.courseType === "BATCH";

  const openCreate = () => {
    setEditingBatch(null);
    setDialogOpen(true);
  };

  const openEdit = (batch: Batch) => {
    setEditingBatch(batch);
    setDialogOpen(true);
  };

  const handleActivate = (batch: Batch) => {
    const hasActive = batches.some((item) => item.status === "ACTIVE");
    const confirmed =
      typeof window === "undefined"
        ? false
        : !hasActive ||
          window.confirm(
            `Activate Batch ${batch.batchNumber}? The currently active batch will be marked as completed.`
          );
    if (confirmed) {
      activateMutation.mutate(batch);
    }
  };

  const handleDelete = (batch: Batch) => {
    const confirmed =
      typeof window === "undefined"
        ? false
        : window.confirm(
            `Delete Batch ${batch.batchNumber}? This action cannot be undone.`
          );
    if (confirmed) {
      deleteMutation.mutate(batch);
    }
  };

  const isRefreshing = courseQuery.isFetching || batchesQuery.isFetching;
  const hasError = courseQuery.isError || batchesQuery.isError;
  const isLoading = courseQuery.isLoading || batchesQuery.isLoading;

  const allCertificatesLocked =
    batches.length > 0 &&
    batches.every((batch) => !batch.certificateUnlocked);
  const hasEnrolledLearners = batches.some(
    (batch) => (batch._count?.enrollments ?? 0) > 0
  );
  const showCertInfoBanner =
    !bannerDismissed && allCertificatesLocked && hasEnrolledLearners;

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 w-fit"
        nativeButton={false}
        render={<Link href="/admin/courses" />}
      >
        <ArrowLeft className="size-4" />
        Back to courses
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {course?.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.thumbnail}
              alt={course.title}
              className="size-12 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
              <BookOpen className="size-6" />
            </span>
          )}
          <div className="min-w-0">
            {courseQuery.isLoading ? (
              <Skeleton className="h-6 w-48" />
            ) : (
              <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
                {course?.title ?? "Course"}
              </h1>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="bg-violet-100 text-violet-700">
                BATCH
              </Badge>
              {!isLoading ? (
                <span className="text-sm text-muted-foreground">
                  {batches.length} {batches.length === 1 ? "batch" : "batches"}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              courseQuery.refetch();
              batchesQuery.refetch();
            }}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button size="sm" onClick={openCreate} disabled={!isBatchCourse}>
            <Plus className="size-4" />
            Add Batch
          </Button>
        </div>
      </div>

      {showCertInfoBanner ? (
        <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <Info className="mt-0.5 size-5 shrink-0 text-blue-600" />
          <div className="flex-1 text-sm text-blue-800">
            Finish adding content to a batch, then click
            <span className="mx-1 font-semibold">
              &ldquo;Mark Certificate Unlocked&rdquo;
            </span>
            to enable certificates for your learners.
          </div>
          <Button variant="outline" size="sm" onClick={dismissBanner}>
            Got it
          </Button>
        </div>
      ) : null}

      {hasError ? (
        <Card className="border-destructive/30">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <span className="inline-flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="size-6" />
            </span>
            <div>
              <p className="font-semibold">Could not load batches</p>
              <p className="text-sm text-muted-foreground">
                {(courseQuery.error ?? batchesQuery.error) instanceof Error
                  ? (courseQuery.error ?? batchesQuery.error)?.message
                  : "Something went wrong."}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                courseQuery.refetch();
                batchesQuery.refetch();
              }}
            >
              <RefreshCw className="size-4" />
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : !courseQuery.isLoading && course && !isBatchCourse ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <span className="inline-flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <AlertTriangle className="size-6" />
            </span>
            <div>
              <p className="font-semibold text-amber-900">
                This is a self-paced course
              </p>
              <p className="text-sm text-amber-800">
                Batch management is only available for batch courses.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/admin/courses" />}
            >
              <ArrowLeft className="size-4" />
              Back to courses
            </Button>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      ) : batches.length === 0 ? (
        <>
          <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
              <div>
                <p className="font-medium text-amber-900">
                  This BATCH course has no batches yet
                </p>
                <p className="text-sm text-amber-800">
                  Learners can&apos;t enroll until you create at least one
                  batch.
                </p>
              </div>
            </div>
            <Button size="sm" className="shrink-0" onClick={openCreate}>
              <Plus className="size-4" />
              Add First Batch
            </Button>
          </div>

          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Calendar className="size-7" />
              </span>
              <div>
                <p className="font-semibold">No batches to display</p>
                <p className="text-sm text-muted-foreground">
                  Create a batch to set a schedule and open enrollment.
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="space-y-4">
          {batches.map((batch) => (
            <BatchCard
              key={batch.id}
              batch={batch}
              courseSlug={course?.slug}
              onActivate={handleActivate}
              onEdit={openEdit}
              onDelete={handleDelete}
              onUnlock={setConfirmBatch}
              isActivating={
                activateMutation.isPending &&
                activateMutation.variables?.id === batch.id
              }
              isDeleting={
                deleteMutation.isPending &&
                deleteMutation.variables?.id === batch.id
              }
            />
          ))}
        </div>
      )}

      <BatchFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        courseId={courseId}
        existingBatch={editingBatch}
        nextBatchNumber={nextBatchNumber}
      />

      <AlertDialog
        open={Boolean(confirmBatch)}
        onOpenChange={(open) => !open && setConfirmBatch(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Unlock Certificate for Batch {confirmBatch?.batchNumber}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will allow all enrolled learners of this batch who have
              completed 100% of the course to generate their certificates. All
              enrolled learners will receive a notification. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                confirmBatch && unlockMutation.mutate(confirmBatch.id)
              }
              disabled={unlockMutation.isPending}
            >
              {unlockMutation.isPending ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Unlocking...
                </>
              ) : (
                "Unlock Certificate"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

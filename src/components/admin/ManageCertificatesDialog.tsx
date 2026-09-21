"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Unlock } from "lucide-react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api";
import type { Batch, BatchListData } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export function ManageCertificatesDialog({
  open,
  onOpenChange,
  courseId,
  courseName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseName: string;
}) {
  const queryClient = useQueryClient();
  const [confirmBatch, setConfirmBatch] = React.useState<Batch | null>(null);

  const batchesQuery = useQuery({
    queryKey: ["batches", courseId],
    queryFn: async () =>
      (await apiFetch<BatchListData>(`/batches/course/${courseId}`)).data,
    enabled: open && Boolean(courseId),
  });

  const batches = batchesQuery.data?.batches ?? [];

  const unlockMutation = useMutation({
    mutationFn: (batchId: string) =>
      apiFetch(`/batches/${batchId}/unlock-certificate`, {
        method: "PATCH",
      }),
    onSuccess: (data) => {
      toast.success(data.message || "Certificate unlocked!");
      queryClient.invalidateQueries({ queryKey: ["batches", courseId] });
      queryClient.invalidateQueries({
        queryKey: ["batches", "for-assignment", courseId],
      });
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to unlock certificate"
      );
    },
  });

  const handleUnlock = (batch: Batch) => {
    unlockMutation.mutate(batch.id, {
      onSettled: () => setConfirmBatch(null),
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Certificates</DialogTitle>
            <DialogDescription>
              {courseName} &mdash; Unlock certificates per batch
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {batchesQuery.isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : null}

            {batches.length === 0 && !batchesQuery.isLoading ? (
              <p className="py-8 text-center text-muted-foreground">
                No batches found for this course.
              </p>
            ) : null}

            {batches.map((batch) => (
              <Card key={batch.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-semibold">
                        Batch {batch.batchNumber}
                      </span>
                      <Badge variant="outline">{batch.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {batch.title}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>
                        📅 {new Date(batch.startDate).toLocaleDateString()} →
                        {new Date(batch.endDate).toLocaleDateString()}
                      </span>
                      <span>👥 {batch._count?.enrollments ?? 0} enrolled</span>
                      <span>📚 {batch._count?.modules ?? 0} modules</span>
                    </div>
                  </div>

                  <div className="shrink-0">
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
                        onClick={() => setConfirmBatch(batch)}
                      >
                        <Unlock className="size-4 mr-2" />
                        Mark Certificate Unlocked
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(confirmBatch)}
        onOpenChange={(isOpen) => !isOpen && setConfirmBatch(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Unlock Certificate for Batch {confirmBatch?.batchNumber}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will allow all enrolled learners of this batch who completed
              100% of the course to generate certificates. All learners will be
              notified. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmBatch) handleUnlock(confirmBatch);
              }}
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
    </>
  );
}
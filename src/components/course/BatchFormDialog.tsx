"use client";

import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Loader2 } from "lucide-react";

import { apiFetch } from "@/lib/api";
import type { Batch, BatchStatus } from "@/types";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUSES: { value: BatchStatus; label: string }[] = [
  { value: "UPCOMING", label: "Upcoming" },
  { value: "ACTIVE", label: "Active" },
  { value: "COMPLETED", label: "Completed" },
];

const batchSchema = z
  .object({
    batchNumber: z.number().min(1, "Batch number must be at least 1"),
    title: z.string().max(120, "Title must be 120 characters or fewer"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    status: z.enum(["UPCOMING", "ACTIVE", "COMPLETED"]),
  })
  .refine(
    (data) =>
      !data.startDate ||
      !data.endDate ||
      new Date(data.endDate) > new Date(data.startDate),
    {
      message: "End date must be after the start date",
      path: ["endDate"],
    }
  );

type BatchFormValues = z.infer<typeof batchSchema>;

function toDateInputValue(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function defaultValuesFor(
  batch: Batch | null,
  nextBatchNumber: number
): BatchFormValues {
  if (batch) {
    return {
      batchNumber: batch.batchNumber,
      title: batch.title ?? "",
      startDate: toDateInputValue(batch.startDate),
      endDate: toDateInputValue(batch.endDate),
      status: batch.status,
    };
  }
  return {
    batchNumber: nextBatchNumber,
    title: "",
    startDate: "",
    endDate: "",
    status: "UPCOMING",
  };
}

export function BatchFormDialog({
  open,
  onOpenChange,
  courseId,
  existingBatch = null,
  nextBatchNumber = 1,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  existingBatch?: Batch | null;
  nextBatchNumber?: number;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(existingBatch);
  const titleTouchedRef = React.useRef(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BatchFormValues>({
    resolver: zodResolver(batchSchema),
    defaultValues: defaultValuesFor(existingBatch, nextBatchNumber),
  });

  React.useEffect(() => {
    if (open) {
      titleTouchedRef.current = Boolean(existingBatch?.title);
      reset(defaultValuesFor(existingBatch, nextBatchNumber));
    }
  }, [open, existingBatch, nextBatchNumber, reset]);

  const titleField = register("title");
  const batchNumberValue = watch("batchNumber");

  React.useEffect(() => {
    if (isEdit || titleTouchedRef.current) return;
    if (typeof batchNumberValue === "number" && batchNumberValue > 0) {
      setValue("title", `Batch ${batchNumberValue}`);
    }
  }, [batchNumberValue, isEdit, setValue]);

  const close = React.useCallback(
    (next: boolean) => {
      if (!next) {
        reset(defaultValuesFor(existingBatch, nextBatchNumber));
      }
      onOpenChange(next);
    },
    [existingBatch, nextBatchNumber, onOpenChange, reset]
  );

  const onSubmit = async (values: BatchFormValues) => {
    const title = values.title.trim();

    try {
      if (isEdit && existingBatch) {
        await apiFetch(`/batches/${existingBatch.id}`, {
          method: "PATCH",
          body: {
            title: title || undefined,
            startDate: values.startDate,
            endDate: values.endDate,
            status: values.status,
          },
        });
        toast.success(`Batch ${existingBatch.batchNumber} updated`);
      } else {
        await apiFetch("/batches", {
          method: "POST",
          body: {
            courseId,
            batchNumber: values.batchNumber,
            title: title || undefined,
            startDate: values.startDate,
            endDate: values.endDate,
            status: values.status,
          },
        });
        toast.success(`Batch ${values.batchNumber} created`);
      }

      queryClient.invalidateQueries({ queryKey: ["batches", courseId] });
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "courses"] });
      close(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : isEdit
            ? "Could not update batch"
            : "Could not create batch"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit batch" : "Add a new batch"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the schedule and status for this batch."
              : "Create a batch so learners can enroll in this course."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="batchNumber">Batch number</Label>
              <Input
                id="batchNumber"
                type="number"
                min={1}
                step="1"
                disabled={isEdit}
                aria-invalid={Boolean(errors.batchNumber)}
                {...register("batchNumber", { valueAsNumber: true })}
              />
              {errors.batchNumber ? (
                <p className="text-xs text-destructive">
                  {errors.batchNumber.message}
                </p>
              ) : isEdit ? (
                <p className="text-xs text-muted-foreground">
                  Batch number cannot be changed.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Must be unique within this course.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="status" className="w-full">
                      <SelectValue>
                        {(value: BatchStatus) =>
                          STATUSES.find((item) => item.value === value)
                            ?.label ?? "Select status"
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                placeholder="e.g. January 2026 Batch"
                aria-invalid={Boolean(errors.title)}
                {...titleField}
                onChange={(event) => {
                  titleTouchedRef.current = event.target.value.length > 0;
                  void titleField.onChange(event);
                }}
              />
              {errors.title ? (
                <p className="text-xs text-destructive">
                  {errors.title.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start date</Label>
              <Input
                id="startDate"
                type="date"
                aria-invalid={Boolean(errors.startDate)}
                {...register("startDate")}
              />
              {errors.startDate ? (
                <p className="text-xs text-destructive">
                  {errors.startDate.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End date</Label>
              <Input
                id="endDate"
                type="date"
                aria-invalid={Boolean(errors.endDate)}
                {...register("endDate")}
              />
              {errors.endDate ? (
                <p className="text-xs text-destructive">
                  {errors.endDate.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
            <CalendarDays className="mt-0.5 size-4 shrink-0" />
            <span>
              Only one batch per course can be <strong>ACTIVE</strong> at a
              time. Activating a batch automatically marks the current active
              batch as completed.
            </span>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => close(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : isEdit ? (
                "Save changes"
              ) : (
                "Create batch"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

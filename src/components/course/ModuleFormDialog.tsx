"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { apiFetch } from "@/lib/api";
import type { Module, ModuleListData } from "@/types";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";

const moduleSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  intro: z.string().max(500, "Intro must be 500 characters or fewer"),
  order: z.number().min(0, "Order must be 0 or greater"),
});

type ModuleFormValues = z.infer<typeof moduleSchema>;

function defaultValuesFor(
  module: Module | null,
  defaultOrder: number
): ModuleFormValues {
  if (module) {
    return {
      title: module.title,
      intro: module.intro ?? "",
      order: module.order,
    };
  }
  return { title: "", intro: "", order: defaultOrder };
}

export function ModuleFormDialog({
  open,
  onOpenChange,
  courseId,
  batchId,
  existingModule = null,
  defaultOrder = 0,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  batchId?: string;
  existingModule?: Module | null;
  defaultOrder?: number;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(existingModule);
  const isCreate = !existingModule;

  const [suggestedOrder, setSuggestedOrder] = React.useState<number>(
    defaultOrder
  );
  const [computingOrder, setComputingOrder] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ModuleFormValues>({
    resolver: zodResolver(moduleSchema),
    defaultValues: defaultValuesFor(existingModule, defaultOrder),
  });

  // Auto-suggest the next available order when creating a new module.
  React.useEffect(() => {
    if (!open) return;
    if (existingModule) {
      setSuggestedOrder(existingModule.order);
      return;
    }

    let cancelled = false;
    setComputingOrder(true);
    const qs = batchId ? `?batchId=${batchId}` : "";

    apiFetch<ModuleListData>(`/modules/course/${courseId}${qs}`)
      .then((res) => {
        const modules = res.data?.modules ?? [];
        const maxOrder =
          modules.length > 0
            ? Math.max(...modules.map((module) => module.order || 0))
            : 0;
        const next = maxOrder + 1;
        if (cancelled) return;
        setSuggestedOrder(next);
        setValue("order", next);
      })
      .catch((err) => {
        console.error("Failed to compute order:", err);
      })
      .finally(() => {
        if (!cancelled) setComputingOrder(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, courseId, batchId, existingModule, setValue]);

  React.useEffect(() => {
    if (open) {
      reset(defaultValuesFor(existingModule, defaultOrder));
    }
  }, [open, existingModule, defaultOrder, reset]);

  const close = React.useCallback(
    (next: boolean) => {
      if (!next) reset(defaultValuesFor(existingModule, defaultOrder));
      onOpenChange(next);
    },
    [existingModule, defaultOrder, onOpenChange, reset]
  );

  const onSubmit = async (values: ModuleFormValues) => {
    const intro = values.intro.trim();

    try {
      if (isEdit && existingModule) {
        await apiFetch(`/modules/${existingModule.id}`, {
          method: "PATCH",
          body: { title: values.title.trim(), intro, order: values.order },
        });
        toast.success("Module updated");
      } else {
        await apiFetch("/modules", {
          method: "POST",
          body: {
            courseId,
            ...(batchId ? { batchId } : {}),
            title: values.title.trim(),
            intro,
            order: values.order,
          },
        });
        toast.success("Module created");
      }

      queryClient.invalidateQueries({ queryKey: ["modules"] });
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      close(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : isEdit
            ? "Could not update module"
            : "Could not create module"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit module" : "Add a new module"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the module details below."
              : "Modules group your lessons into logical sections."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="module-title">Title</Label>
            <Input
              id="module-title"
              placeholder="e.g. Introduction to Grammar"
              aria-invalid={Boolean(errors.title)}
              {...register("title")}
            />
            {errors.title ? (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="module-intro">Intro (optional)</Label>
            <Textarea
              id="module-intro"
              rows={3}
              placeholder="What will learners get from this module?"
              aria-invalid={Boolean(errors.intro)}
              {...register("intro")}
            />
            {errors.intro ? (
              <p className="text-xs text-destructive">{errors.intro.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="module-order">Order</Label>
              {isCreate ? (
                computingOrder ? (
                  <Badge variant="secondary" className="shrink-0">
                    <Loader2 className="mr-1 size-3 animate-spin" />
                    computing…
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="shrink-0">
                    suggested: {suggestedOrder}
                  </Badge>
                )
              ) : null}
            </div>
            <Input
              id="module-order"
              type="number"
              min={0}
              step="1"
              aria-invalid={Boolean(errors.order)}
              {...register("order", { valueAsNumber: true })}
            />
            {isCreate ? (
              <p className="text-xs text-muted-foreground">
                Auto-set to {suggestedOrder} &mdash; the next available number.
                Change only if you need to reorder.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Controls the display order. Lower numbers appear first.
              </p>
            )}
            {errors.order ? (
              <p className="text-xs text-destructive">{errors.order.message}</p>
            ) : null}
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
                "Create module"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Info, Loader2 } from "lucide-react";
import { cn } from "cn";

import { apiFetch } from "@/lib/api";
import type { Lesson, LessonListData, LessonType } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const LESSON_TYPES: { value: LessonType; label: string }[] = [
  { value: "VIDEO", label: "Video" },
  { value: "TEXT", label: "Text" },
  { value: "QUIZ", label: "Quiz" },
];

const PROVIDERS: { value: "youtube" | "vimeo"; label: string }[] = [
  { value: "youtube", label: "YouTube" },
  { value: "vimeo", label: "Vimeo" },
];

const lessonSchema = z
  .object({
    type: z.enum(["VIDEO", "TEXT", "QUIZ"]),
    title: z.string().min(2, "Title must be at least 2 characters"),
    description: z.string(),
    order: z.number().min(0, "Order must be 0 or greater"),
    provider: z.enum(["youtube", "vimeo"]),
    videoId: z.string(),
    videoUrl: z.string(),
    duration: z.number().nullable(),
    thumbnail: z.string(),
    content: z.string(),
    isFree: z.boolean(),
    isPublished: z.boolean(),
    availableAt: z.string(),
    notifyStudents: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "VIDEO") {
      if (!data.videoId.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["videoId"],
          message: "Video ID is required",
        });
      }
      if (data.duration !== null && data.duration < 0) {
        ctx.addIssue({
          code: "custom",
          path: ["duration"],
          message: "Duration cannot be negative",
        });
      }
    }
    if (data.type === "TEXT" && !data.content.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["content"],
        message: "Content is required for text lessons",
      });
    }
  });

type LessonFormValues = z.infer<typeof lessonSchema>;

function toDateInputValue(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function buildVideoUrl(provider: string, videoId: string): string {
  const id = videoId.trim();
  if (!id) return "";
  return provider === "vimeo"
    ? `https://vimeo.com/${id}`
    : `https://www.youtube.com/watch?v=${id}`;
}

function defaultValuesFor(
  lesson: Lesson | null,
  defaultOrder: number
): LessonFormValues {
  if (lesson) {
    return {
      type: lesson.type,
      title: lesson.title,
      description: lesson.description ?? "",
      order: lesson.order,
      provider: lesson.provider === "vimeo" ? "vimeo" : "youtube",
      videoId: lesson.videoId ?? "",
      videoUrl: lesson.videoUrl ?? "",
      duration: lesson.duration ?? null,
      thumbnail: lesson.thumbnail ?? "",
      content: lesson.content ?? "",
      isFree: lesson.isFree,
      isPublished: lesson.isPublished,
      availableAt: toDateInputValue(lesson.availableAt),
      notifyStudents: false,
    };
  }
  return {
    type: "VIDEO",
    title: "",
    description: "",
    order: defaultOrder,
    provider: "youtube",
    videoId: "",
    videoUrl: "",
    duration: null,
    thumbnail: "",
    content: "",
    isFree: false,
    isPublished: false,
    availableAt: "",
    notifyStudents: false,
  };
}

export function LessonFormDialog({
  open,
  onOpenChange,
  moduleId,
  existingLesson = null,
  defaultOrder = 0,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleId: string;
  existingLesson?: Lesson | null;
  defaultOrder?: number;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(existingLesson);
  const isCreate = !existingLesson;
  const videoUrlTouchedRef = React.useRef(false);

  const [suggestedOrder, setSuggestedOrder] = React.useState<number>(
    defaultOrder
  );
  const [computingOrder, setComputingOrder] = React.useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LessonFormValues>({
    resolver: zodResolver(lessonSchema),
    defaultValues: defaultValuesFor(existingLesson, defaultOrder),
  });

  React.useEffect(() => {
    if (open) {
      videoUrlTouchedRef.current = Boolean(existingLesson?.videoUrl);
      reset(defaultValuesFor(existingLesson, defaultOrder));
    }
  }, [open, existingLesson, defaultOrder, reset]);

  // Auto-suggest the next available order when creating a new lesson.
  React.useEffect(() => {
    if (!open) return;
    if (existingLesson) {
      setSuggestedOrder(existingLesson.order);
      return;
    }
    if (!moduleId) return;

    let cancelled = false;
    setComputingOrder(true);

    apiFetch<LessonListData>(`/lessons/module/${moduleId}`)
      .then((res) => {
        const lessons = res.data?.lessons ?? [];
        const maxOrder =
          lessons.length > 0
            ? Math.max(...lessons.map((lesson) => lesson.order || 0))
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
  }, [open, moduleId, existingLesson, setValue]);

  const type = watch("type");
  const provider = watch("provider");
  const videoId = watch("videoId");
  const videoUrlField = register("videoUrl");

  React.useEffect(() => {
    if (type !== "VIDEO" || videoUrlTouchedRef.current) return;
    setValue("videoUrl", buildVideoUrl(provider, videoId ?? ""));
  }, [type, provider, videoId, setValue]);

  const close = React.useCallback(
    (next: boolean) => {
      if (!next) reset(defaultValuesFor(existingLesson, defaultOrder));
      onOpenChange(next);
    },
    [existingLesson, defaultOrder, onOpenChange, reset]
  );

  const onSubmit = async (values: LessonFormValues) => {
    const payload: Record<string, unknown> = {
      title: values.title.trim(),
      description: values.description.trim() || null,
      order: values.order,
      isFree: values.isFree,
      isPublished: values.isPublished,
      availableAt: values.availableAt || null,
    };

    if (values.type === "VIDEO") {
      payload.videoId = values.videoId.trim();
      payload.videoUrl =
        values.videoUrl.trim() ||
        buildVideoUrl(values.provider, values.videoId);
      payload.provider = values.provider;
      payload.duration = values.duration;
      payload.thumbnail = values.thumbnail.trim() || null;
    } else if (values.type === "TEXT") {
      payload.content = values.content;
    } else {
      payload.content = null;
    }

    try {
      if (isEdit && existingLesson) {
        await apiFetch(`/lessons/${existingLesson.id}`, {
          method: "PATCH",
          body: payload,
        });
        toast.success("Lesson updated");
      } else {
        await apiFetch("/lessons", {
          method: "POST",
          body: {
            moduleId,
            type: values.type,
            ...payload,
            notifyStudents: values.notifyStudents,
          },
        });
        toast.success(
          values.notifyStudents
            ? "Lesson created and students notified"
            : "Lesson created"
        );
      }

      queryClient.invalidateQueries({ queryKey: ["lessons", moduleId] });
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      close(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : isEdit
            ? "Could not update lesson"
            : "Could not create lesson"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit lesson" : "Add a new lesson"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the lesson content and settings."
              : "Lessons are the individual items learners study inside a module."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label>Lesson type</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="grid grid-cols-3 gap-3"
                >
                  {LESSON_TYPES.map((item) => (
                    <label
                      key={item.value}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors",
                        isEdit
                          ? "cursor-not-allowed opacity-60"
                          : "cursor-pointer",
                        field.value === item.value
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <RadioGroupItem
                        value={item.value}
                        disabled={isEdit}
                      />
                      <span className="font-medium">{item.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              )}
            />
            {isEdit ? (
              <p className="text-xs text-muted-foreground">
                Lesson type cannot be changed after creation.
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="lesson-title">Title</Label>
              <Input
                id="lesson-title"
                placeholder="e.g. What is a noun?"
                aria-invalid={Boolean(errors.title)}
                {...register("title")}
              />
              {errors.title ? (
                <p className="text-xs text-destructive">
                  {errors.title.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="lesson-description">Description (optional)</Label>
              <Textarea
                id="lesson-description"
                rows={2}
                placeholder="A short summary shown in the lesson list."
                {...register("description")}
              />
            </div>

            {type === "VIDEO" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="lesson-provider">Video provider</Label>
                  <Controller
                    name="provider"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id="lesson-provider" className="w-full">
                          <SelectValue>
                            {(value: string) =>
                              PROVIDERS.find((item) => item.value === value)
                                ?.label ?? "YouTube"
                            }
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {PROVIDERS.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lesson-duration">Duration (seconds)</Label>
                  <Input
                    id="lesson-duration"
                    type="number"
                    min={0}
                    step="1"
                    placeholder="600"
                    aria-invalid={Boolean(errors.duration)}
                    {...register("duration", {
                      setValueAs: (value) =>
                        value === "" || value === null || value === undefined
                          ? null
                          : Number(value),
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    600 = 10 minutes
                  </p>
                  {errors.duration ? (
                    <p className="text-xs text-destructive">
                      {errors.duration.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="lesson-video-id">Video ID</Label>
                  <Input
                    id="lesson-video-id"
                    placeholder="942PSbDTXgo"
                    aria-invalid={Boolean(errors.videoId)}
                    {...register("videoId")}
                  />
                  <p className="text-xs text-muted-foreground">
                    For YouTube URL
                    https://youtube.com/watch?v=942PSbDTXgo &rarr; enter
                    942PSbDTXgo
                  </p>
                  {errors.videoId ? (
                    <p className="text-xs text-destructive">
                      {errors.videoId.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="lesson-video-url">Video URL</Label>
                  <Input
                    id="lesson-video-url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    {...videoUrlField}
                    onChange={(event) => {
                      videoUrlTouchedRef.current =
                        event.target.value.length > 0;
                      void videoUrlField.onChange(event);
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-generated from the provider and video ID. You can
                    override it.
                  </p>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="lesson-thumbnail">
                    Thumbnail URL (optional)
                  </Label>
                  <Input
                    id="lesson-thumbnail"
                    placeholder="https://example.com/thumb.jpg"
                    {...register("thumbnail")}
                  />
                </div>
              </>
            ) : null}

            {type === "TEXT" ? (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="lesson-content">Content</Label>
                <Textarea
                  id="lesson-content"
                  rows={10}
                  placeholder="Write your lesson content here. Markdown is supported."
                  aria-invalid={Boolean(errors.content)}
                  {...register("content")}
                />
                <p className="text-xs text-muted-foreground">
                  Markdown supported.
                </p>
                {errors.content ? (
                  <p className="text-xs text-destructive">
                    {errors.content.message}
                  </p>
                ) : null}
              </div>
            ) : null}

            {type === "QUIZ" ? (
              <div className="flex items-start gap-2 rounded-lg border border-purple-200 bg-purple-50 p-3 text-sm text-purple-900 sm:col-span-2">
                <Info className="mt-0.5 size-4 shrink-0" />
                <span>
                  Save this lesson first, then add quiz questions from the
                  module view.
                </span>
              </div>
            ) : null}

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="lesson-order">Order</Label>
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
                id="lesson-order"
                type="number"
                min={0}
                step="1"
                aria-invalid={Boolean(errors.order)}
                {...register("order", { valueAsNumber: true })}
              />
              {isCreate ? (
                <p className="text-xs text-muted-foreground">
                  Auto-set to {suggestedOrder} &mdash; the next available
                  number. Change only if you need to reorder.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Controls the display order. Lower numbers appear first.
                </p>
              )}
              {errors.order ? (
                <p className="text-xs text-destructive">
                  {errors.order.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lesson-available-at">
                Available from (optional)
              </Label>
              <Input
                id="lesson-available-at"
                type="date"
                {...register("availableAt")}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to make it available immediately.
              </p>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border p-3">
            <label
              htmlFor="lesson-is-free"
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Controller
                name="isFree"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="lesson-is-free"
                    checked={field.value}
                    onCheckedChange={(checked) =>
                      field.onChange(Boolean(checked))
                    }
                  />
                )}
              />
              <span>Free preview lesson</span>
            </label>

            <label
              htmlFor="lesson-is-published"
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Controller
                name="isPublished"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="lesson-is-published"
                    checked={field.value}
                    onCheckedChange={(checked) =>
                      field.onChange(Boolean(checked))
                    }
                  />
                )}
              />
              <span>Published (visible to learners)</span>
            </label>

            {!isEdit ? (
              <label
                htmlFor="lesson-notify"
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <Controller
                  name="notifyStudents"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="lesson-notify"
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(Boolean(checked))
                      }
                    />
                  )}
                />
                <span>Notify enrolled students about this lesson</span>
              </label>
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
                "Create lesson"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

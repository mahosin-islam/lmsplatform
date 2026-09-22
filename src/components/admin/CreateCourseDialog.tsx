"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { cn } from "cn";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Course, CourseLevel, CourseStatus, CourseType } from "@/types";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const courseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  courseType: z.enum(["FIXED", "BATCH"]),
  thumbnail: z
    .string()
    .trim()
    .url("Enter a valid image URL")
    .or(z.literal("")),
  price: z.number().min(0, "Price cannot be negative"),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});

type CourseFormValues = z.infer<typeof courseSchema>;

const COURSE_TYPES: { value: CourseType; label: string; hint: string }[] = [
  {
    value: "FIXED",
    label: "Self-Paced",
    hint: "Learn anytime. No batch schedule required.",
  },
  {
    value: "BATCH",
    label: "Batched",
    hint: "Cohort based with start and end dates.",
  },
];

const LEVELS: { value: CourseLevel; label: string }[] = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

const STATUSES: { value: CourseStatus; label: string }[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];

const DEFAULT_VALUES: CourseFormValues = {
  title: "",
  slug: "",
  description: "",
  courseType: "FIXED",
  thumbnail: "",
  price: 0,
  level: "BEGINNER",
  status: "DRAFT",
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function valuesFromCourse(course: Course): CourseFormValues {
  return {
    title: course.title,
    slug: course.slug,
    description: course.description,
    courseType: course.courseType,
    thumbnail: course.thumbnail ?? "",
    price: course.price,
    level: course.level,
    status: course.status,
  };
}

export function CreateCourseDialog({
  open,
  onOpenChange,
  course = null,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course?: Course | null;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = course !== null;
  const slugTouchedRef = React.useRef(isEdit);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: course ? valuesFromCourse(course) : DEFAULT_VALUES,
  });

  const slugField = register("slug");
  const titleValue = watch("title");

  React.useEffect(() => {
    if (!slugTouchedRef.current) {
      setValue("slug", slugify(titleValue ?? ""));
    }
  }, [titleValue, setValue]);

  React.useEffect(() => {
    if (open) {
      reset(course ? valuesFromCourse(course) : DEFAULT_VALUES);
      slugTouchedRef.current = isEdit;
    }
  }, [open, course, isEdit, reset]);

  const close = React.useCallback(
    (next: boolean) => {
      if (!next) {
        reset(course ? valuesFromCourse(course) : DEFAULT_VALUES);
        slugTouchedRef.current = isEdit;
      }
      onOpenChange(next);
    },
    [onOpenChange, reset, course, isEdit]
  );

  const onSubmit = async (values: CourseFormValues) => {
    if (isEdit) {
      try {
        await apiFetch<Course>(`/courses/${course.id}`, {
          method: "PATCH",
          body: {
            title: values.title.trim(),
            slug: values.slug.trim(),
            description: values.description.trim(),
            thumbnail: values.thumbnail.trim() || null,
            price: values.price,
            level: values.level,
            status: values.status,
          },
        });

        toast.success("Course updated successfully");
        queryClient.invalidateQueries({ queryKey: ["admin"] });
        queryClient.invalidateQueries({ queryKey: ["courses"] });
        close(false);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not update course"
        );
      }
      return;
    }

    if (!user) {
      toast.error("You must be signed in to create a course");
      return;
    }

    try {
      const res = await apiFetch<Course>("/courses", {
        method: "POST",
        body: {
          title: values.title.trim(),
          slug: values.slug.trim(),
          description: values.description.trim(),
          courseType: values.courseType,
          thumbnail: values.thumbnail.trim() || undefined,
          price: values.price,
          level: values.level,
          status: values.status,
          adminId: user.id,
        },
      });

      const created = res.data;
      toast.success("Course created successfully");
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      close(false);

      if (values.courseType === "BATCH" && created) {
        toast("Next step: add batches", {
          description:
            "This is a batched course. Add batch cohorts so learners can enroll.",
          action: {
            label: "Add batches →",
            onClick: () => router.push(`/admin/courses/${created.id}/batches`),
          },
        });
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not create course"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit course" : "Create a new course"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the course details below. Course type cannot be changed after creation."
              : "Fill in the details below. You can add modules and lessons after the course is created."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="title">Course title</Label>
              <Input
                id="title"
                placeholder="Complete React Development"
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
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                placeholder="complete-react-development"
                aria-invalid={Boolean(errors.slug)}
                {...slugField}
                onChange={(event) => {
                  slugTouchedRef.current = true;
                  void slugField.onChange(event);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Used in the course URL. Auto-generated from the title.
              </p>
              {errors.slug ? (
                <p className="text-xs text-destructive">
                  {errors.slug.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                placeholder="What will learners get from this course?"
                aria-invalid={Boolean(errors.description)}
                {...register("description")}
              />
              {errors.description ? (
                <p className="text-xs text-destructive">
                  {errors.description.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Course type</Label>
              <Controller
                name="courseType"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={isEdit ? undefined : field.onChange}
                    className="grid gap-3 sm:grid-cols-2"
                  >
                    {COURSE_TYPES.map((type) => (
                      <label
                        key={type.value}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                          field.value === type.value
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "hover:bg-muted/50",
                          isEdit && "cursor-not-allowed opacity-60"
                        )}
                      >
                        <RadioGroupItem
                          value={type.value}
                          className="mt-0.5"
                          disabled={isEdit}
                        />
                        <span>
                          <span className="block text-sm font-medium">
                            {type.label}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {type.hint}
                          </span>
                        </span>
                      </label>
                    ))}
                  </RadioGroup>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (৳)</Label>
              <Input
                id="price"
                type="number"
                min={0}
                step="1"
                placeholder="0"
                aria-invalid={Boolean(errors.price)}
                {...register("price", { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">
                Set 0 to make the course free.
              </p>
              {errors.price ? (
                <p className="text-xs text-destructive">
                  {errors.price.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">Level</Label>
              <Controller
                name="level"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="level" className="w-full">
                      <SelectValue>
                        {(value: CourseLevel) =>
                          LEVELS.find((item) => item.value === value)?.label ??
                          "Select level"
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {LEVELS.map((item) => (
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
              <Label htmlFor="thumbnail">Thumbnail URL (optional)</Label>
              <Input
                id="thumbnail"
                placeholder="https://example.com/image.jpg"
                aria-invalid={Boolean(errors.thumbnail)}
                {...register("thumbnail")}
              />
              {errors.thumbnail ? (
                <p className="text-xs text-destructive">
                  {errors.thumbnail.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="status">Status</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="status" className="w-full">
                      <SelectValue>
                        {(value: CourseStatus) =>
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
                  {isEdit ? "Saving..." : "Creating..."}
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  {isEdit ? "Save changes" : "Create course"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

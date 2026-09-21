"use client";

import * as React from "react";
import Link from "next/link";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Eye,
  EyeOff,
  FileText,
  HelpCircle,
  ListChecks,
  Loader2,
  MoreVertical,
  Pencil,
  PlayCircle,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { cn } from "cn";

import { apiFetch } from "@/lib/api";
import type {
  BatchListData,
  Course,
  Lesson,
  LessonListData,
  LessonType,
  Module,
  ModuleListData,
} from "@/types";
import { LessonFormDialog } from "@/components/course/LessonFormDialog";
import { ModuleFormDialog } from "@/components/course/ModuleFormDialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const LESSON_TYPE_CONFIG: Record<
  LessonType,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    tint: string;
    badgeClass: string;
  }
> = {
  VIDEO: {
    label: "VIDEO",
    icon: PlayCircle,
    tint: "bg-blue-100 text-blue-600",
    badgeClass: "bg-blue-100 text-blue-700",
  },
  TEXT: {
    label: "TEXT",
    icon: FileText,
    tint: "bg-slate-100 text-slate-600",
    badgeClass: "bg-slate-200 text-slate-700",
  },
  QUIZ: {
    label: "QUIZ",
    icon: HelpCircle,
    tint: "bg-purple-100 text-purple-600",
    badgeClass: "bg-purple-100 text-purple-700",
  },
};

type ConfirmTarget =
  | { kind: "module"; id: string; label: string }
  | { kind: "lesson"; id: string; label: string; moduleId: string };

function lessonMeta(lesson: Lesson): string {
  if (lesson.type === "VIDEO") {
    if (lesson.duration && lesson.duration > 0) {
      const minutes = Math.round(lesson.duration / 60);
      return minutes >= 1 ? `${minutes} min` : `${lesson.duration}s`;
    }
    return "Video";
  }
  if (lesson.type === "TEXT") {
    const words = lesson.content
      ? lesson.content.trim().split(/\s+/).filter(Boolean).length
      : 0;
    return words > 0 ? `${words.toLocaleString()} words` : "Text lesson";
  }
  const count = lesson._count?.quizzes ?? 0;
  return count > 0
    ? `${count} question${count === 1 ? "" : "s"}`
    : "Quiz";
}

function LessonRow({
  lesson,
  index,
  onEdit,
  onDelete,
  onTogglePublish,
  isToggling,
}: {
  lesson: Lesson;
  index: number;
  onEdit: (lesson: Lesson) => void;
  onDelete: (lesson: Lesson) => void;
  onTogglePublish: (lesson: Lesson) => void;
  isToggling: boolean;
}) {
  const config = LESSON_TYPE_CONFIG[lesson.type];
  const Icon = config.icon;
  const scheduled = lesson.availableAt
    ? new Date(lesson.availableAt).getTime() > Date.now()
    : false;

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-white p-3">
      <span
        className={cn(
          "inline-flex size-9 shrink-0 items-center justify-center rounded-lg",
          config.tint
        )}
      >
        <Icon className="size-4" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className={config.badgeClass}>
            {config.label}
          </Badge>
          <span className="truncate text-sm font-medium">
            {index + 1}. {lesson.title}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {lessonMeta(lesson)}
          </span>
          {lesson.isFree ? (
            <Badge className="bg-green-100 text-green-700">Free</Badge>
          ) : null}
          {lesson.isPublished ? (
            <Badge className="bg-green-100 text-green-700">Published</Badge>
          ) : (
            <Badge className="bg-gray-200 text-gray-600">Draft</Badge>
          )}
          {scheduled ? (
            <Badge className="bg-amber-100 text-amber-700">Scheduled</Badge>
          ) : null}
        </div>

        {lesson.type === "QUIZ" ? (
          <Link
            href={`/admin/lessons/${lesson.id}/quiz`}
            className={cn(
              "mt-2 inline-flex w-fit items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-colors",
              (lesson._count?.quizzes ?? 0) === 0
                ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                : "border-input bg-background hover:bg-muted"
            )}
          >
            {(lesson._count?.quizzes ?? 0) === 0 ? (
              <>
                <AlertTriangle className="size-3.5" />
                No questions yet &mdash; click to add
              </>
            ) : (
              <>
                <ListChecks className="size-3.5" />
                {lesson._count?.quizzes}{" "}
                {(lesson._count?.quizzes ?? 0) === 1
                  ? "question"
                  : "questions"}
                <span className="text-muted-foreground">
                  &middot; Manage Questions
                </span>
              </>
            )}
          </Link>
        ) : null}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Actions for ${lesson.title}`}
            />
          }
        >
          <MoreVertical className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(lesson)}>
            <Pencil className="size-4" />
            Edit Lesson
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onTogglePublish(lesson)}
            disabled={isToggling}
          >
            {lesson.isPublished ? (
              <>
                <EyeOff className="size-4" />
                Unpublish
              </>
            ) : (
              <>
                <Eye className="size-4" />
                Publish
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => onDelete(lesson)}
          >
            <Trash2 className="size-4" />
            Delete Lesson
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function ModulePanel({
  module,
  index,
  isOpen,
  onEditModule,
  onDeleteModule,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onTogglePublish,
  pendingToggleLessonId,
}: {
  module: Module;
  index: number;
  isOpen: boolean;
  onEditModule: (module: Module) => void;
  onDeleteModule: (module: Module) => void;
  onAddLesson: (module: Module) => void;
  onEditLesson: (module: Module, lesson: Lesson) => void;
  onDeleteLesson: (module: Module, lesson: Lesson) => void;
  onTogglePublish: (lesson: Lesson) => void;
  pendingToggleLessonId: string | null;
}) {
  const lessonsQuery = useQuery({
    queryKey: ["lessons", module.id],
    queryFn: async () =>
      (await apiFetch<LessonListData>(`/lessons/module/${module.id}`)).data,
    enabled: isOpen,
  });

  const lessons = React.useMemo(() => {
    const list = lessonsQuery.data?.lessons ?? [];
    return [...list].sort((a, b) => a.order - b.order);
  }, [lessonsQuery.data]);

  const lessonCount = module._count?.lessons ?? lessons.length;

  return (
    <AccordionItem
      value={module.id}
      className="mb-3 rounded-xl border bg-white px-3"
    >
      <div className="flex items-start gap-1">
        <div className="min-w-0 flex-1">
          <AccordionTrigger className="w-full hover:no-underline">
            <div className="flex min-w-0 items-start gap-3">
              <BookOpen className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="truncate font-medium">
                  Module {index + 1}: {module.title}
                </p>
                {module.intro ? (
                  <p className="truncate text-xs font-normal text-muted-foreground">
                    {module.intro}
                  </p>
                ) : null}
                <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                  {lessonCount} lesson{lessonCount === 1 ? "" : "s"} ·{" "}
                  {module._count?.assignments ?? 0} assignment
                  {(module._count?.assignments ?? 0) === 1 ? "" : "s"}
                </p>
              </div>
            </div>
          </AccordionTrigger>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Actions for ${module.title}`}
              />
            }
          >
            <MoreVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEditModule(module)}>
              <Pencil className="size-4" />
              Edit Module
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDeleteModule(module)}
            >
              <Trash2 className="size-4" />
              Delete Module
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AccordionContent>
        <div className="space-y-2">
          {lessonsQuery.isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))
          ) : lessonsQuery.isError ? (
            <p className="py-3 text-center text-sm text-destructive">
              Could not load lessons.
            </p>
          ) : lessons.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No lessons yet
            </p>
          ) : (
            lessons.map((lesson, lessonIndex) => (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                index={lessonIndex}
                onEdit={(item) => onEditLesson(module, item)}
                onDelete={(item) => onDeleteLesson(module, item)}
                onTogglePublish={onTogglePublish}
                isToggling={pendingToggleLessonId === lesson.id}
              />
            ))
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onAddLesson(module)}
          >
            <Plus className="size-4" />
            Add Lesson to this Module
          </Button>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function CourseContent() {
  const params = useParams<{ id: string }>();
  const courseId = params?.id ?? "";
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const batchIdParam = searchParams.get("batchId");

  const [openModules, setOpenModules] = React.useState<string[]>([]);
  const [moduleDialogOpen, setModuleDialogOpen] = React.useState(false);
  const [editingModule, setEditingModule] = React.useState<Module | null>(null);
  const [lessonDialogOpen, setLessonDialogOpen] = React.useState(false);
  const [lessonDialogModule, setLessonDialogModule] =
    React.useState<Module | null>(null);
  const [editingLesson, setEditingLesson] = React.useState<Lesson | null>(null);
  const [confirmTarget, setConfirmTarget] = React.useState<ConfirmTarget | null>(
    null
  );

  const courseQuery = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => (await apiFetch<Course>(`/courses/${courseId}`)).data,
    enabled: Boolean(courseId),
  });

  const course = courseQuery.data;
  const isBatch = course?.courseType === "BATCH";

  const batchesQuery = useQuery({
    queryKey: ["batches", courseId],
    queryFn: async () =>
      (await apiFetch<BatchListData>(`/batches/course/${courseId}`)).data,
    enabled: Boolean(courseId) && isBatch,
  });

  const batches = React.useMemo(() => {
    const list = batchesQuery.data?.batches ?? [];
    return [...list].sort((a, b) => a.batchNumber - b.batchNumber);
  }, [batchesQuery.data]);

  const selectedBatchId = React.useMemo(() => {
    if (!isBatch) return undefined;
    if (batchIdParam && batches.some((batch) => batch.id === batchIdParam)) {
      return batchIdParam;
    }
    return batches[0]?.id;
  }, [isBatch, batchIdParam, batches]);

  React.useEffect(() => {
    if (isBatch && selectedBatchId && batchIdParam !== selectedBatchId) {
      router.replace(`${pathname}?batchId=${selectedBatchId}`, {
        scroll: false,
      });
    }
  }, [isBatch, selectedBatchId, batchIdParam, router, pathname]);

  const modulesQuery = useQuery({
    queryKey: ["modules", courseId, selectedBatchId ?? null],
    queryFn: async () => {
      const qs = selectedBatchId ? `?batchId=${selectedBatchId}` : "";
      return (
        await apiFetch<ModuleListData>(`/modules/course/${courseId}${qs}`)
      ).data;
    },
    enabled:
      Boolean(courseId) &&
      courseQuery.isSuccess &&
      (!isBatch || Boolean(selectedBatchId)),
  });

  const modules = React.useMemo(() => {
    const list = modulesQuery.data?.modules ?? [];
    return [...list].sort((a, b) => a.order - b.order);
  }, [modulesQuery.data]);

  const modulesKey = modules.map((module) => module.id).join("|");
  const prevModulesKeyRef = React.useRef("");

  React.useEffect(() => {
    if (prevModulesKeyRef.current !== modulesKey) {
      prevModulesKeyRef.current = modulesKey;
      setOpenModules(modules.map((module) => module.id));
    }
  }, [modulesKey, modules]);

  const deleteModuleMutation = useMutation({
    mutationFn: async (id: string) =>
      apiFetch(`/modules/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Module deleted");
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not delete module"
      );
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async ({ id }: { id: string; moduleId: string }) =>
      apiFetch(`/lessons/${id}`, { method: "DELETE" }),
    onSuccess: (_data, variables) => {
      toast.success("Lesson deleted");
      queryClient.invalidateQueries({
        queryKey: ["lessons", variables.moduleId],
      });
      queryClient.invalidateQueries({ queryKey: ["modules"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not delete lesson"
      );
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({
      id,
      isPublished,
    }: {
      id: string;
      isPublished: boolean;
    }) => apiFetch(`/lessons/${id}`, { method: "PATCH", body: { isPublished } }),
    onSuccess: (_data, variables) => {
      toast.success(
        variables.isPublished ? "Lesson published" : "Lesson unpublished"
      );
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not update lesson"
      );
    },
  });

  const openCreateModule = () => {
    setEditingModule(null);
    setModuleDialogOpen(true);
  };
  const openEditModule = (module: Module) => {
    setEditingModule(module);
    setModuleDialogOpen(true);
  };
  const openCreateLesson = (module: Module) => {
    setLessonDialogModule(module);
    setEditingLesson(null);
    setLessonDialogOpen(true);
  };
  const openEditLesson = (module: Module, lesson: Lesson) => {
    setLessonDialogModule(module);
    setEditingLesson(lesson);
    setLessonDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!confirmTarget) return;
    const done = () => setConfirmTarget(null);
    if (confirmTarget.kind === "module") {
      deleteModuleMutation.mutate(confirmTarget.id, { onSuccess: done });
    } else {
      deleteLessonMutation.mutate(
        { id: confirmTarget.id, moduleId: confirmTarget.moduleId },
        { onSuccess: done }
      );
    }
  };

  const handleRefresh = () => {
    courseQuery.refetch();
    if (isBatch) batchesQuery.refetch();
    modulesQuery.refetch();
  };

  const nextModuleOrder =
    modules.length > 0
      ? Math.max(...modules.map((module) => module.order)) + 1
      : 1;
  const nextLessonOrder =
    (lessonDialogModule?._count?.lessons ?? 0) > 0
      ? (lessonDialogModule?._count?.lessons ?? 0) + 1
      : 1;

  const isDeleting =
    deleteModuleMutation.isPending || deleteLessonMutation.isPending;
  const pendingToggleLessonId = togglePublishMutation.isPending
    ? (togglePublishMutation.variables?.id ?? null)
    : null;

  const isLoading =
    courseQuery.isLoading || (isBatch && batchesQuery.isLoading);
  const noBatches = isBatch && !batchesQuery.isLoading && batches.length === 0;

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
              {course ? (
                <Badge
                  variant="secondary"
                  className={cn(
                    course.courseType === "BATCH"
                      ? "bg-violet-100 text-violet-700"
                      : "bg-blue-100 text-blue-700"
                  )}
                >
                  {course.courseType}
                </Badge>
              ) : null}
              {!isLoading ? (
                <span className="text-sm text-muted-foreground">
                  {modules.length} module{modules.length === 1 ? "" : "s"}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={courseQuery.isFetching || modulesQuery.isFetching}
          >
            <RefreshCw
              className={cn(
                "size-4",
                (courseQuery.isFetching || modulesQuery.isFetching) &&
                  "animate-spin"
              )}
            />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={openCreateModule}
            disabled={isLoading || noBatches}
          >
            <Plus className="size-4" />
            Add Module
          </Button>
        </div>
      </div>

      {isBatch && batches.length > 0 ? (
        <Tabs
          value={selectedBatchId}
          onValueChange={(value) =>
            router.replace(`${pathname}?batchId=${String(value)}`, {
              scroll: false,
            })
          }
        >
          <TabsList className="h-auto flex-wrap">
            {batches.map((batch) => (
              <TabsTrigger key={batch.id} value={batch.id}>
                Batch {batch.batchNumber}
                {batch.status ? ` (${batch.status})` : ""}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      ) : null}

      {courseQuery.isError ? (
        <Card className="border-destructive/30">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <span className="inline-flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="size-6" />
            </span>
            <div>
              <p className="font-semibold">Could not load the course</p>
              <p className="text-sm text-muted-foreground">
                {courseQuery.error instanceof Error
                  ? courseQuery.error.message
                  : "Something went wrong."}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="size-4" />
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : noBatches ? (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-medium text-amber-900">
                Create at least one batch before adding content
              </p>
              <p className="text-sm text-amber-800">
                Modules and lessons for a batch course belong to a specific
                batch.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="shrink-0"
            nativeButton={false}
            render={<Link href={`/admin/courses/${courseId}/batches`} />}
          >
            Manage Batches →
          </Button>
        </div>
      ) : (
        <>
          {modulesQuery.isError ? (
            <Card className="border-destructive/30">
              <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <span className="inline-flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <AlertCircle className="size-6" />
                </span>
                <div>
                  <p className="font-semibold">Could not load modules</p>
                  <p className="text-sm text-muted-foreground">
                    {modulesQuery.error instanceof Error
                      ? modulesQuery.error.message
                      : "Something went wrong."}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => modulesQuery.refetch()}
                >
                  <RefreshCw className="size-4" />
                  Try again
                </Button>
              </CardContent>
            </Card>
          ) : modulesQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : modules.length === 0 ? (
            <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-900">No modules yet</p>
                  <p className="text-sm text-amber-800">
                    Add your first module to start building content.
                  </p>
                </div>
              </div>
              <Button size="sm" className="shrink-0" onClick={openCreateModule}>
                <Plus className="size-4" />
                Add First Module
              </Button>
            </div>
          ) : (
            <Accordion
              multiple
              value={openModules}
              onValueChange={(value) =>
                setOpenModules(Array.isArray(value) ? (value as string[]) : [])
              }
            >
              {modules.map((module, index) => (
                <ModulePanel
                  key={module.id}
                  module={module}
                  index={index}
                  isOpen={openModules.includes(module.id)}
                  onEditModule={openEditModule}
                  onDeleteModule={(item) =>
                    setConfirmTarget({
                      kind: "module",
                      id: item.id,
                      label: item.title,
                    })
                  }
                  onAddLesson={openCreateLesson}
                  onEditLesson={openEditLesson}
                  onDeleteLesson={(item, lesson) =>
                    setConfirmTarget({
                      kind: "lesson",
                      id: lesson.id,
                      label: lesson.title,
                      moduleId: item.id,
                    })
                  }
                  onTogglePublish={(lesson) =>
                    togglePublishMutation.mutate({
                      id: lesson.id,
                      isPublished: !lesson.isPublished,
                    })
                  }
                  pendingToggleLessonId={pendingToggleLessonId}
                />
              ))}
            </Accordion>
          )}
        </>
      )}

      <ModuleFormDialog
        open={moduleDialogOpen}
        onOpenChange={setModuleDialogOpen}
        courseId={courseId}
        batchId={selectedBatchId}
        existingModule={editingModule}
        defaultOrder={nextModuleOrder}
      />

      <LessonFormDialog
        open={lessonDialogOpen}
        onOpenChange={setLessonDialogOpen}
        moduleId={lessonDialogModule?.id ?? ""}
        existingLesson={editingLesson}
        defaultOrder={nextLessonOrder}
      />

      <AlertDialog
        open={Boolean(confirmTarget)}
        onOpenChange={(open) => {
          if (!open) setConfirmTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {confirmTarget?.kind === "module" ? "module" : "lesson"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{confirmTarget?.label}&rdquo; will be removed. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function CourseContentPage() {
  return (
    <React.Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      }
    >
      <CourseContent />
    </React.Suspense>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  Eye,
  HelpCircle,
  Loader2,
  Plus,
  RefreshCw,
  Save,
} from "lucide-react";
import { cn } from "cn";

import { apiFetch } from "@/lib/api";
import type { Lesson, Module, Quiz, QuizListData } from "@/types";
import {
  QuizQuestionCard,
  type LocalQuizQuestion,
  type QuizQuestionErrors,
} from "@/components/course/QuizQuestionCard";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";

type QuestionRow = { clientKey: string; data: LocalQuizQuestion };

function createClientKey(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `q_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function letterFor(index: number): string {
  return String.fromCharCode(65 + index);
}

function coerceOptions(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === "string" ? item : String(item)));
  }
  return [];
}

function sameQuestion(
  a: LocalQuizQuestion,
  b?: LocalQuizQuestion
): boolean {
  if (!b) return false;
  return (
    a.question === b.question &&
    a.correctAnswer === b.correctAnswer &&
    a.order === b.order &&
    a.options.length === b.options.length &&
    a.options.every((option, index) => option === b.options[index])
  );
}

function validateQuestion(question: LocalQuizQuestion): QuizQuestionErrors {
  const errors: QuizQuestionErrors = {};

  if (!question.question.trim()) {
    errors.question = "Question text is required";
  }

  if (question.options.length < 2) {
    errors.options = "At least 2 options are required";
  } else if (question.options.some((option) => !option.trim())) {
    errors.options = "Every option must be filled in";
  }

  const correctIndex = question.options.findIndex(
    (option) => option === question.correctAnswer
  );
  if (correctIndex === -1 || !question.correctAnswer.trim()) {
    errors.correctAnswer = "Select the correct answer";
  }

  return errors;
}

function normalizeQuestion(question: LocalQuizQuestion) {
  const options = question.options.map((option) => option.trim());
  const correctIndex = question.options.findIndex(
    (option) => option === question.correctAnswer
  );
  return {
    question: question.question.trim(),
    options,
    correctAnswer:
      correctIndex >= 0 ? options[correctIndex] : question.correctAnswer.trim(),
    order: question.order,
  };
}

function nextOrder(rows: QuestionRow[]): number {
  return rows.reduce((max, row) => Math.max(max, row.data.order), 0) + 1;
}

export default function LessonQuizPage() {
  const params = useParams<{ id: string }>();
  const lessonId = params?.id ?? "";
  const queryClient = useQueryClient();

  const [rows, setRows] = React.useState<QuestionRow[]>([]);
  const [initialRows, setInitialRows] = React.useState<QuestionRow[]>([]);
  const [deletedIds, setDeletedIds] = React.useState<string[]>([]);
  const [errors, setErrors] = React.useState<
    Record<string, QuizQuestionErrors>
  >({});
  const [pendingDeleteKey, setPendingDeleteKey] = React.useState<string | null>(
    null
  );
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewAnswers, setPreviewAnswers] = React.useState<
    Record<string, string>
  >({});

  const initializedRef = React.useRef(false);
  const resyncRef = React.useRef(false);

  const lessonQuery = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: async () => (await apiFetch<Lesson>(`/lessons/${lessonId}`)).data,
    enabled: Boolean(lessonId),
  });

  const lesson = lessonQuery.data;
  const moduleId = lesson?.moduleId ?? lesson?.module?.id ?? "";
  const isQuiz = lesson?.type === "QUIZ";

  const moduleQuery = useQuery({
    queryKey: ["module", moduleId],
    queryFn: async () => (await apiFetch<Module>(`/modules/${moduleId}`)).data,
    enabled: Boolean(moduleId),
  });

  const quizzesQuery = useQuery({
    queryKey: ["quizzes", lessonId],
    queryFn: async () =>
      (await apiFetch<QuizListData>(`/quizzes/lesson/${lessonId}`)).data,
    enabled: Boolean(lessonId) && isQuiz,
  });

  React.useEffect(() => {
    initializedRef.current = false;
    resyncRef.current = false;
  }, [lessonId]);

  React.useEffect(() => {
    const data = quizzesQuery.data;
    if (!data) return;
    if (initializedRef.current && !resyncRef.current) return;
    initializedRef.current = true;
    resyncRef.current = false;

    const nextRows: QuestionRow[] = (data.quizzes ?? []).map((quiz: Quiz) => ({
      clientKey: quiz.id,
      data: {
        id: quiz.id,
        question: quiz.question,
        options: coerceOptions(quiz.options),
        correctAnswer: quiz.correctAnswer,
        order: quiz.order,
      },
    }));

    setRows(nextRows);
    setInitialRows(nextRows);
    setDeletedIds([]);
    setErrors({});
  }, [quizzesQuery.data]);

  const initialById = React.useMemo(() => {
    const map = new Map<string, LocalQuizQuestion>();
    initialRows.forEach((row) => {
      if (row.data.id) map.set(row.data.id, row.data);
    });
    return map;
  }, [initialRows]);

  const newCount = rows.filter((row) => row.data.isNew).length;
  const modifiedCount = rows.filter(
    (row) =>
      row.data.id &&
      !row.data.isNew &&
      !sameQuestion(row.data, initialById.get(row.data.id))
  ).length;
  const deletedCount = deletedIds.length;
  const totalChanges = newCount + modifiedCount + deletedCount;
  const isDirty = totalChanges > 0;

  const handleChange = (clientKey: string, updated: LocalQuizQuestion) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.clientKey !== clientKey) return row;
        const dirty = updated.id
          ? !sameQuestion(updated, initialById.get(updated.id))
          : false;
        return { ...row, data: { ...updated, isDirty: dirty } };
      })
    );
    setErrors((prev) => {
      if (!prev[clientKey]) return prev;
      const next = { ...prev };
      delete next[clientKey];
      return next;
    });
  };

  const addQuestion = () => {
    setRows((prev) => [
      ...prev,
      {
        clientKey: createClientKey(),
        data: {
          question: "",
          options: ["", ""],
          correctAnswer: "",
          order: nextOrder(prev),
          isNew: true,
        },
      },
    ]);
  };

  const duplicateQuestion = (clientKey: string) => {
    setRows((prev) => {
      const index = prev.findIndex((row) => row.clientKey === clientKey);
      if (index === -1) return prev;
      const source = prev[index].data;
      const copy: LocalQuizQuestion = {
        ...source,
        id: undefined,
        isNew: true,
        isDirty: false,
        order: nextOrder(prev),
      };
      const next = [...prev];
      next.splice(index + 1, 0, { clientKey: createClientKey(), data: copy });
      return next;
    });
  };

  const removeQuestion = (clientKey: string) => {
    const row = rows.find((item) => item.clientKey === clientKey);
    if (row?.data.id) {
      const id = row.data.id;
      setDeletedIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
    }
    setRows((prev) => prev.filter((item) => item.clientKey !== clientKey));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[clientKey];
      return next;
    });
    setPendingDeleteKey(null);
  };

  const discard = () => {
    setRows(
      initialRows.map((row) => ({
        clientKey: row.clientKey,
        data: { ...row.data },
      }))
    );
    setDeletedIds([]);
    setErrors({});
    toast.info("Changes discarded");
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      for (const id of deletedIds) {
        await apiFetch(`/quizzes/${id}`, { method: "DELETE" });
      }

      const newQuestions = rows.filter((row) => row.data.isNew);
      if (newQuestions.length > 0) {
        await apiFetch("/quizzes/bulk", {
          method: "POST",
          body: {
            lessonId,
            quizzes: newQuestions.map((row) =>
              normalizeQuestion(row.data)
            ),
          },
        });
      }

      const modified = rows.filter(
        (row) =>
          row.data.id &&
          !row.data.isNew &&
          !sameQuestion(row.data, initialById.get(row.data.id))
      );
      for (const row of modified) {
        await apiFetch(`/quizzes/${row.data.id}`, {
          method: "PATCH",
          body: normalizeQuestion(row.data),
        });
      }
    },
    onSuccess: () => {
      toast.success("Quiz saved");
      resyncRef.current = true;
      queryClient.invalidateQueries({ queryKey: ["quizzes", lessonId] });
      queryClient.invalidateQueries({ queryKey: ["lesson", lessonId] });
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not save quiz"
      );
    },
  });

  const handleSave = () => {
    const nextErrors: Record<string, QuizQuestionErrors> = {};
    rows.forEach((row) => {
      const rowErrors = validateQuestion(row.data);
      if (Object.keys(rowErrors).length > 0) {
        nextErrors[row.clientKey] = rowErrors;
      }
    });

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error(
        `Fix ${Object.keys(nextErrors).length} question${
          Object.keys(nextErrors).length === 1 ? "" : "s"
        } before saving`
      );
      return;
    }

    setErrors({});
    saveMutation.mutate();
  };

  const openPreview = () => {
    setPreviewAnswers({});
    setPreviewOpen(true);
  };

  const refresh = () => {
    lessonQuery.refetch();
    quizzesQuery.refetch();
    if (moduleId) moduleQuery.refetch();
  };

  const courseTitle = moduleQuery.data?.course?.title ?? "Course";
  const moduleTitle =
    moduleQuery.data?.title ?? lesson?.module?.title ?? "Module";
  const contentHref = moduleQuery.data
    ? `/admin/courses/${moduleQuery.data.courseId}/content${
        moduleQuery.data.batchId
          ? `?batchId=${moduleQuery.data.batchId}`
          : ""
      }`
    : "/admin/courses";

  if (lessonQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-72" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (lessonQuery.isError) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <span className="inline-flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="size-6" />
          </span>
          <div>
            <p className="font-semibold">Could not load the lesson</p>
            <p className="text-sm text-muted-foreground">
              {lessonQuery.error instanceof Error
                ? lessonQuery.error.message
                : "Something went wrong."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => lessonQuery.refetch()}>
              <RefreshCw className="size-4" />
              Try again
            </Button>
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/admin/courses" />}>
              <ArrowLeft className="size-4" />
              Back to courses
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!lesson || lesson.type !== "QUIZ") {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <span className="inline-flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <AlertCircle className="size-6" />
          </span>
          <div>
            <p className="font-semibold text-amber-900">
              This lesson is not a quiz
            </p>
            <p className="text-sm text-amber-800">
              Quiz questions can only be managed for lessons of type QUIZ.
              {lesson ? ` This lesson is a ${lesson.type} lesson.` : ""}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href={contentHref} />}
          >
            <ArrowLeft className="size-4" />
            Back to course content
          </Button>
        </CardContent>
      </Card>
    );
  }

  const pendingDeleteRow = pendingDeleteKey
    ? rows.find((row) => row.clientKey === pendingDeleteKey)
    : undefined;

  return (
    <div className="space-y-6">
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground"
      >
        <Link href="/admin/courses" className="hover:text-foreground">
          Courses
        </Link>
        <ChevronRight className="size-3.5" />
        <Link
          href={contentHref}
          className="max-w-[12rem] truncate hover:text-foreground"
        >
          {courseTitle}
        </Link>
        <ChevronRight className="size-3.5" />
        <Link
          href={contentHref}
          className="max-w-[12rem] truncate hover:text-foreground"
        >
          {moduleTitle}
        </Link>
        <ChevronRight className="size-3.5" />
        <Link
          href={contentHref}
          className="max-w-[12rem] truncate hover:text-foreground"
        >
          {lesson.title}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="font-medium text-foreground">Quiz</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
              {lesson.title}
            </h1>
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              QUIZ
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length} question{rows.length === 1 ? "" : "s"} ·{" "}
            {totalChanges} unsaved change{totalChanges === 1 ? "" : "s"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={refresh}
            disabled={quizzesQuery.isFetching}
            aria-label="Refresh questions"
          >
            <RefreshCw
              className={cn(
                "size-4",
                quizzesQuery.isFetching && "animate-spin"
              )}
            />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={openPreview}
            disabled={rows.length === 0}
          >
            <Eye className="size-4" />
            Preview
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="size-4" />
                Save All Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {quizzesQuery.isError ? (
        <Card className="border-destructive/30">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <span className="inline-flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="size-6" />
            </span>
            <div>
              <p className="font-semibold">Could not load questions</p>
              <p className="text-sm text-muted-foreground">
                {quizzesQuery.error instanceof Error
                  ? quizzesQuery.error.message
                  : "Something went wrong."}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => quizzesQuery.refetch()}
            >
              <RefreshCw className="size-4" />
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : quizzesQuery.isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
              <HelpCircle className="size-7" />
            </span>
            <div>
              <p className="font-semibold">No questions yet</p>
              <p className="text-sm text-muted-foreground">
                Add your first question to build this quiz.
              </p>
            </div>
            <Button size="sm" onClick={addQuestion}>
              <Plus className="size-4" />
              Add New Question
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 pb-24">
          {rows.map((row, index) => (
            <QuizQuestionCard
              key={row.clientKey}
              question={row.data}
              index={index}
              errors={errors[row.clientKey]}
              onChange={(updated) => handleChange(row.clientKey, updated)}
              onDelete={() => setPendingDeleteKey(row.clientKey)}
              onDuplicate={() => duplicateQuestion(row.clientKey)}
            />
          ))}
          <Button variant="outline" className="w-full" onClick={addQuestion}>
            <Plus className="size-4" />
            Add New Question
          </Button>
        </div>
      )}

      <div className="sticky bottom-0 z-20 -mx-6 border-t bg-background/95 px-6 py-3 backdrop-blur md:-mx-8 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {rows.length} question{rows.length === 1 ? "" : "s"} · {totalChanges}{" "}
            to save
            {newCount > 0 || modifiedCount > 0 || deletedCount > 0 ? (
              <span className="hidden sm:inline">
                {" "}
                ({newCount} new, {modifiedCount} edited, {deletedCount} deleted)
              </span>
            ) : null}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={discard}
              disabled={!isDirty || saveMutation.isPending}
            >
              Discard
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!isDirty || saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Save All Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog
        open={Boolean(pendingDeleteKey)}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteKey(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete question?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;
              {pendingDeleteRow?.data.question.trim() || "Untitled question"}
              &rdquo; will be removed when you save your changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (pendingDeleteKey) removeQuestion(pendingDeleteKey);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Quiz preview</DialogTitle>
            <DialogDescription>
              {lesson.title} · {rows.length} question
              {rows.length === 1 ? "" : "s"}. Learner preview — answers are not
              saved.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {rows.map((row, index) => (
              <div key={row.clientKey} className="space-y-2 rounded-lg border p-3">
                <p className="font-medium">
                  {index + 1}.{" "}
                  {row.data.question.trim() || "Untitled question"}
                </p>
                <RadioGroup
                  value={previewAnswers[row.clientKey]}
                  onValueChange={(value) =>
                    setPreviewAnswers((prev) => ({
                      ...prev,
                      [row.clientKey]: String(value),
                    }))
                  }
                  className="gap-2"
                >
                  {row.data.options.map((option, optionIndex) => (
                    <label
                      key={optionIndex}
                      className="flex cursor-pointer items-center gap-2 rounded-md p-1.5 text-sm hover:bg-muted/60"
                    >
                      <RadioGroupItem
                        value={option}
                        disabled={!option.trim()}
                      />
                      <span>
                        {letterFor(optionIndex)}){" "}
                        {option.trim() ? (
                          option
                        ) : (
                          <span className="text-muted-foreground">
                            Empty option
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

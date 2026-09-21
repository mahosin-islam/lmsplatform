"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  HelpCircle,
  Hourglass,
  Loader2,
  Lock,
  PlayCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { cn } from "cn";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type {
  CompleteLessonData,
  Course,
  CourseProgressData,
  EnrollmentListData,
  Lesson,
  LessonType,
  ProgressModule,
} from "@/types";
import { VideoPlayer } from "@/components/learner/VideoPlayer";
import { QuizPlayer } from "@/components/learner/QuizPlayer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface FlatLesson {
  lessonId: string;
  moduleId: string;
  moduleTitle: string;
  title: string;
  order: number;
  type: LessonType | undefined;
  isUnlocked: boolean;
  isCompleted: boolean;
  isAccessible: boolean;
  availableAt: string | null;
  duration: number | null;
  isFree: boolean;
}

function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || isNaN(seconds) || seconds < 0) return "";
  const total = Math.round(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function LessonTypeIcon({
  type,
  className = "size-4",
}: {
  type?: LessonType;
  className?: string;
}) {
  if (type === "VIDEO") return <PlayCircle className={cn(className, "text-slate-500")} />;
  if (type === "QUIZ") return <HelpCircle className={cn(className, "text-amber-500")} />;
  return <FileText className={cn(className, "text-blue-500")} />;
}

interface ErrorCardProps {
  title: string;
  message: string;
  onRetry: () => void;
}

function ErrorCard({ title, message, onRetry }: ErrorCardProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed p-12 text-center">
      <span className="inline-flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="size-6" />
      </span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      </div>
      <Button onClick={onRetry}>
        <RefreshCw className="size-4" />
        Try again
      </Button>
    </div>
  );
}

interface LockedLessonProps {
  title: string;
  unlockPending: boolean;
  unlockError: string | null;
  onRetryUnlock: () => void;
}

function LockedLessonNotice({
  title,
  unlockPending,
  unlockError,
  onRetryUnlock,
}: LockedLessonProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed bg-muted/30 p-12 text-center">
      <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-slate-200 text-slate-600">
        <Lock className="size-7" />
      </span>
      <div>
        <h3 className="font-semibold">{title ? `${title} is locked` : "Lesson is locked"}</h3>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          {unlockError
            ? unlockError
            : unlockPending
              ? "Unlocking your lessons…"
              : "Complete the previous lessons to unlock this content."}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {unlockError ? (
          <Button onClick={onRetryUnlock} disabled={unlockPending}>
            {unlockPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Try again
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default function LearnerLearnPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <LearnCourseContent />
    </Suspense>
  );
}

function LearnCourseContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const params = useParams<{ courseId: string }>();
  const searchParams = useSearchParams();

  const courseId = params?.courseId ?? "";
  const learnerId = user?.id ?? "";
  const paramLessonId = searchParams.get("lesson");
  const paramBatchId = searchParams.get("batchId");

  const [openModules, setOpenModules] = useState<Set<string>>(new Set());

  // ─────────────────────────────────────────────
  // Queries
  // ─────────────────────────────────────────────
  const enrollmentsQuery = useQuery({
    queryKey: ["enrollments", "my", learnerId],
    enabled: Boolean(learnerId),
    queryFn: async () =>
      (await apiFetch<EnrollmentListData>(`/enrollments/my/${learnerId}`)).data,
  });

  const enrollment = enrollmentsQuery.data?.enrollments.find(
    (item) => item.courseId === courseId
  );

  const effBatchId = paramBatchId ?? enrollment?.batchId ?? null;
  const enrollmentsSettled = !enrollmentsQuery.isLoading;

  const progressQuery = useQuery({
    queryKey: ["progress", learnerId, courseId, effBatchId ?? ""],
    enabled: Boolean(learnerId && courseId && enrollmentsSettled && enrollment),
    queryFn: async () =>
      (
        await apiFetch<CourseProgressData>(
          `/progress/my/${learnerId}/course/${courseId}${
            effBatchId ? `?batchId=${effBatchId}` : ""
          }`
        )
      ).data,
  });

  const progress = progressQuery.data;

  const courseQuery = useQuery({
    queryKey: ["course", courseId],
    enabled: Boolean(courseId),
    queryFn: async () => (await apiFetch<Course>(`/courses/${courseId}`)).data,
  });

  const course = courseQuery.data;

  // ─────────────────────────────────────────────
  // Derived: flat lesson list
  // ─────────────────────────────────────────────
  const lessonMeta = useMemo(() => {
    const map = new Map<
      string,
      { duration: number | null; isFree: boolean }
    >();
    course?.modules?.forEach((module) => {
      module.lessons?.forEach((lesson) => {
        map.set(lesson.id, {
          duration: lesson.duration ?? null,
          isFree: lesson.isFree ?? false,
        });
      });
    });
    return map;
  }, [course]);

  const flatLessons = useMemo<FlatLesson[]>(() => {
    const flat: FlatLesson[] = [];
    (progress?.modules ?? []).forEach((module) => {
      module.lessons.forEach((lesson) => {
        if (!lesson.id) return;
        const meta = lessonMeta.get(lesson.id);
        const isUnlocked =
          Boolean(lesson.progress?.isUnlocked) ||
          Boolean(lesson.progress?.isCompleted);
        const availableAt = lesson.availableAt ?? null;
        const dateOpen =
          !availableAt || new Date(availableAt).getTime() <= Date.now();
        flat.push({
          lessonId: lesson.id,
          moduleId: module.id,
          moduleTitle: module.title,
          title: lesson.title,
          order: flat.length,
          type: lesson.type,
          isUnlocked,
          isCompleted: Boolean(lesson.progress?.isCompleted),
          isAccessible: isUnlocked && dateOpen,
          availableAt,
          duration: meta?.duration ?? null,
          isFree: meta?.isFree ?? false,
        });
      });
    });
    return flat;
  }, [progress, lessonMeta]);

  const progressLoaded = Boolean(progress) && !progressQuery.isLoading;
  const totalLessons = flatLessons.length;

  // Preferred lesson: first accessible lesson; otherwise first lesson.
  const fallbackLesson = useMemo(
    () => flatLessons.find((lesson) => lesson.isAccessible) ?? flatLessons[0],
    [flatLessons]
  );

  // Current lesson: use the ?lesson= param when it exists AND is accessible,
  // otherwise fall back to the first accessible lesson (or first lesson).
  const currentLessonId = useMemo(() => {
    if (paramLessonId) {
      const found = flatLessons.find((lesson) => lesson.lessonId === paramLessonId);
      if (found && found.isAccessible) return found.lessonId;
    }
    return fallbackLesson?.lessonId ?? null;
  }, [paramLessonId, flatLessons, fallbackLesson]);

  const currentIndex = useMemo(
    () => flatLessons.findIndex((lesson) => lesson.lessonId === currentLessonId),
    [flatLessons, currentLessonId]
  );

  const currentFlatLesson =
    currentIndex >= 0 ? flatLessons[currentIndex] : undefined;

  const previousLesson =
    currentIndex > 0 ? flatLessons[currentIndex - 1] : undefined;
  const nextLesson =
    currentIndex >= 0 && currentIndex < totalLessons - 1
      ? flatLessons[currentIndex + 1]
      : undefined;

  const completedCount = flatLessons.filter((lesson) => lesson.isCompleted).length;
  const headerPercent = enrollment
    ? enrollment.progress
    : totalLessons > 0
      ? Math.round((completedCount / totalLessons) * 100)
      : 0;

  const isCourseComplete = Boolean(
    enrollment &&
      (enrollment.status === "COMPLETED" || enrollment.progress === 100)
  );
  const isBatchLocked = Boolean(
    enrollment?.batch && enrollment.batch.certificateUnlocked !== true
  );

  const lessonQuery = useQuery({
    queryKey: ["lesson", currentLessonId],
    enabled: Boolean(currentLessonId),
    queryFn: async () =>
      (await apiFetch<Lesson>(`/lessons/${currentLessonId}`)).data,
  });

  const currentLesson = lessonQuery.data;

  useEffect(() => {
    if (enrollmentsQuery.isError) {
      console.error("Enrollments fetch failed:", enrollmentsQuery.error);
    }
    if (progressQuery.isError) {
      console.error("Progress fetch failed:", progressQuery.error);
    }
    if (courseQuery.isError) {
      console.error("Course fetch failed:", courseQuery.error);
    }
    if (lessonQuery.isError) {
      console.error("Lesson fetch failed:", lessonQuery.error);
    }
  }, [
    enrollmentsQuery.isError,
    enrollmentsQuery.error,
    progressQuery.isError,
    progressQuery.error,
    courseQuery.isError,
    courseQuery.error,
    lessonQuery.isError,
    lessonQuery.error,
  ]);

  // ─────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────
  const buildLessonHref = useCallback(
    (lessonId: string) => {
      const qs = new URLSearchParams();
      if (effBatchId) qs.set("batchId", effBatchId);
      qs.set("lesson", lessonId);
      return `${pathname}?${qs.toString()}`;
    },
    [pathname, effBatchId]
  );

  const goToLesson = useCallback(
    (lessonId: string) => {
      router.push(buildLessonHref(lessonId));
    },
    [router, buildLessonHref]
  );

  // ─────────────────────────────────────────────
  // Auto-unlock the first lesson (fires ONCE, no toast on load)
  // ─────────────────────────────────────────────
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const unlockAttemptedRef = useRef(false);

  const unlockMutation = useMutation({
    mutationFn: async () =>
      apiFetch("/progress/unlock-first", {
        method: "POST",
        body: {
          learnerId,
          courseId,
          ...(effBatchId ? { batchId: effBatchId } : {}),
        },
      }),
    onSuccess: () => {
      setUnlockError(null);
      queryClient.invalidateQueries({
        queryKey: ["progress", learnerId, courseId],
      });
    },
    onError: (error) => {
      console.error("unlock-first failed:", error);
      setUnlockError(
        error instanceof Error
          ? error.message
          : "Could not unlock the first lesson"
      );
      toast.error("Failed to unlock course. Please try again.");
    },
  });

  // Only fire unlock-first when:
  //  - progress loaded successfully (and not mid-refetch)
  //  - course has lessons
  //  - NO lesson in the progress data is unlocked yet
  useEffect(() => {
    if (unlockAttemptedRef.current) return;
    if (!progressLoaded || !courseId) return;
    if (progressQuery.isFetching) return;
    const modules = progress?.modules ?? [];
    if (modules.length === 0) return;
    const anyUnlocked = modules.some((module) =>
      (module.lessons ?? []).some(
        (lesson) => lesson.progress?.isUnlocked === true
      )
    );
    if (anyUnlocked) return;
    unlockAttemptedRef.current = true;
    setUnlockError(null);
    unlockMutation.mutate();
  }, [
    progressLoaded,
    progressQuery.isFetching,
    progress,
    courseId,
    unlockMutation,
  ]);

  // ─────────────────────────────────────────────
  // Temporary debug logging (remove after fixing)
  // ─────────────────────────────────────────────
  useEffect(() => {
    console.log("Progress data:", progress);
    console.log("Modules count:", progress?.modules?.length);
    console.log(
      "Any unlocked:",
      (progress?.modules ?? []).some((module) =>
        (module.lessons ?? []).some(
          (lesson) => lesson.progress?.isUnlocked === true
        )
      )
    );
    console.log("unlockAttempted:", unlockAttemptedRef.current);
    console.log("unlockFirst pending:", unlockMutation.isPending);
  }, [progress, unlockMutation.isPending]);

  // ─────────────────────────────────────────────
  // Heal orphaned lessons: if a completed lesson's next-by-order
  // sibling is still locked (e.g. admin added a new lesson after
  // the learner already completed its predecessor), re-trigger the
  // complete endpoint so the backend unlocks it. Fires ONCE.
  // ─────────────────────────────────────────────
  const healingRef = useRef(false);

  useEffect(() => {
    console.log("=== HEAL EFFECT RUN ===");
    console.log("healingRef:", healingRef.current);
    console.log("progressLoaded:", progressLoaded);
    console.log("progressQuery.isFetching:", progressQuery.isFetching);
    console.log("learnerId:", learnerId);
    console.log("courseId:", courseId);
    console.log("progress exists:", Boolean(progress));

    if (healingRef.current) {
      console.log("SKIP: already attempted");
      return;
    }
    if (!progressLoaded || !courseId || progressQuery.isFetching || !learnerId) {
      console.log(
        "SKIP: not ready (progressLoaded=%s courseId=%s fetching=%s learnerId=%s)",
        progressLoaded,
        courseId,
        progressQuery.isFetching,
        learnerId
      );
      return;
    }

    const modules = progress?.modules ?? [];

    const sortedModules = [...modules].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0)
    );
    console.log(`Checking ${sortedModules.length} modules for orphans`);

    if (sortedModules.length === 0) {
      console.log("SKIP: no modules");
      return;
    }

    const orphanedLessonIds: string[] = [];

    for (let mIdx = 0; mIdx < sortedModules.length; mIdx++) {
      const mod = sortedModules[mIdx];
      const lessons = (mod.lessons ?? [])
        .slice()
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      console.log(`Module "${mod.title}" - ${lessons.length} lessons`);

      // Check WITHIN module
      for (let i = 0; i < lessons.length - 1; i++) {
        const curr = lessons[i];
        const next = lessons[i + 1];

        console.log(
          `  ${curr.title} (order ${curr.order}, completed: ${curr.progress?.isCompleted}) ` +
            `→ ${next.title} (order ${next.order}, unlocked: ${next.progress?.isUnlocked})`
        );

        if (
          curr.progress?.isCompleted === true &&
          next.progress?.isUnlocked !== true &&
          curr.id
        ) {
          console.log("  ⚠️ ORPHANED:", curr.id, "->", next.title);
          orphanedLessonIds.push(curr.id);
        }
      }

      // Check CROSS-MODULE boundary
      if (lessons.length > 0) {
        const lastLesson = lessons[lessons.length - 1];
        const nextModule = sortedModules[mIdx + 1];

        if (nextModule && (nextModule.lessons ?? []).length > 0) {
          const nextModuleFirstLesson = [...(nextModule.lessons ?? [])]
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0];

          console.log(
            `  ══ boundary: ${lastLesson.title} (completed: ${lastLesson.progress?.isCompleted}) ` +
              `→ [next module] ${nextModuleFirstLesson.title} (unlocked: ${nextModuleFirstLesson.progress?.isUnlocked})`
          );

          if (
            nextModuleFirstLesson &&
            lastLesson.progress?.isCompleted === true &&
            nextModuleFirstLesson.progress?.isUnlocked !== true &&
            lastLesson.id
          ) {
            console.log(
              "  ⚠️ CROSS-MODULE ORPHANED:",
              lastLesson.id,
              "->",
              nextModuleFirstLesson.title
            );
            orphanedLessonIds.push(lastLesson.id);
          }
        }
      }
    }

    console.log("Orphaned lesson IDs:", orphanedLessonIds);

    if (orphanedLessonIds.length === 0) {
      console.log("No orphans, skip");
      return;
    }

    healingRef.current = true;

    Promise.all(
      orphanedLessonIds.map((lessonId) =>
        apiFetch("/progress/complete", {
          method: "POST",
          body: { learnerId, lessonId },
        })
          .then((r) => {
            console.log("Heal POST success for", lessonId, r);
            return r;
          })
          .catch((err) => {
            console.error("Heal POST failed for", lessonId, err);
          })
      )
    ).then(() => {
      console.log("All heals done, invalidating");
      queryClient.invalidateQueries({
        queryKey: ["progress", learnerId, courseId],
      });
    });
  }, [progressLoaded, progressQuery.isFetching, progress, learnerId, courseId, queryClient]);

  // ─────────────────────────────────────────────
  // Redirects: not enrolled / pending payment
  // ─────────────────────────────────────────────
  const redirectedRef = useRef(false);
  useEffect(() => {
    if (authLoading || !enrollmentsSettled) return;
    if (enrollmentsQuery.isError) return;
    if (redirectedRef.current) return;
    if (!enrollment) {
      redirectedRef.current = true;
      router.replace(course?.slug ? `/courses/${course.slug}` : "/courses");
      return;
    }
    if (enrollment.status === "PENDING") {
      redirectedRef.current = true;
      router.replace(`/checkout/${enrollment.id}`);
    }
  }, [authLoading, enrollmentsSettled, enrollmentsQuery.isError, enrollment, course, router]);

  // ─────────────────────────────────────────────
  // Normalize the lesson in the URL (SILENTLY).
  // No toasts — this only sets a valid, accessible lesson.
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!progressLoaded) return;
    if (!fallbackLesson) return;
    if (paramLessonId === fallbackLesson.lessonId) return;
    const target = paramLessonId
      ? flatLessons.find((lesson) => lesson.lessonId === paramLessonId)
      : undefined;
    const paramOk = Boolean(target && target.isAccessible);
    if (paramOk) return;
    router.replace(buildLessonHref(fallbackLesson.lessonId), { scroll: false });
  }, [progressLoaded, paramLessonId, flatLessons, fallbackLesson, buildLessonHref, router]);

  // ─────────────────────────────────────────────
  // Auto-expand the module containing the current lesson
  // ─────────────────────────────────────────────
  const currentModuleId = currentFlatLesson?.moduleId ?? "";
  useEffect(() => {
    if (!currentModuleId) return;
    setOpenModules((prev) => new Set([...(prev ?? []), currentModuleId]));
  }, [currentModuleId]);

  // ─────────────────────────────────────────────
  // Mark lesson complete
  // ─────────────────────────────────────────────
  const completeMutation = useMutation({
    mutationFn: async (payload: { learnerId: string; lessonId: string }) => {
      const res = await apiFetch<CompleteLessonData>("/progress/complete", {
        method: "POST",
        body: payload,
      });
      if (!res.data) throw new Error("Could not complete the lesson");
      return res.data;
    },
    onSuccess: async (data, payload) => {
      const { lessonId } = payload;
      toast.success("Lesson completed!");

      const progressKey = ["progress", learnerId, courseId, effBatchId ?? ""];
      const nextIndex = flatLessons.findIndex((lesson) => lesson.lessonId === lessonId);
      const next = nextIndex >= 0 ? flatLessons[nextIndex + 1] : undefined;

      // Optimistically update the cache so the sidebar and the next lesson
      // reflect the unlock immediately instead of after the refetch.
      queryClient.setQueryData<CourseProgressData>(progressKey, (old) => {
        if (!old) return old;
        return {
          modules: old.modules.map((module) => ({
            ...module,
            lessons: module.lessons.map((lesson) => {
              if (lesson.id === lessonId) {
                const prev = lesson.progress;
                return {
                  ...lesson,
                  progress: {
                    learnerId: prev?.learnerId ?? "",
                    lessonId: prev?.lessonId ?? lesson.id,
                    isCompleted: true,
                    isUnlocked: true,
                    completedAt: prev?.completedAt ?? null,
                    id: prev?.id,
                    createdAt: prev?.createdAt,
                    updatedAt: prev?.updatedAt,
                  },
                };
              }
              if (next && lesson.id === next.lessonId) {
                const prev = lesson.progress;
                return {
                  ...lesson,
                  progress: {
                    learnerId: prev?.learnerId ?? "",
                    lessonId: prev?.lessonId ?? lesson.id,
                    isCompleted: prev?.isCompleted ?? false,
                    isUnlocked: true,
                    completedAt: prev?.completedAt ?? null,
                    id: prev?.id,
                    createdAt: prev?.createdAt,
                    updatedAt: prev?.updatedAt,
                  },
                };
              }
              return lesson;
            }),
          })),
        };
      });

      queryClient.setQueryData<EnrollmentListData>(
        ["enrollments", "my", learnerId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            enrollments: old.enrollments.map((item) =>
              item.courseId === courseId
                ? { ...item, progress: data.enrollmentProgress }
                : item
            ),
          };
        }
      );

      await queryClient.invalidateQueries({
        queryKey: ["progress", learnerId, courseId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["enrollments", "my", learnerId],
      });

      if (next) {
        window.setTimeout(() => {
          goToLesson(next.lessonId);
        }, 800);
      }
    },
    onError: (error) => {
      console.error("Complete lesson failed:", error);
      const message =
        error instanceof Error ? error.message : "Could not complete the lesson";

      if (message.toLowerCase().includes("not enrolled")) {
        console.error("Enrollment context on 'not enrolled':", {
          learnerId,
          lessonId: currentLesson?.id ?? null,
          lessonModuleBatchId: currentLesson?.module?.batchId ?? null,
          lessonModuleCourseId: currentLesson?.module?.courseId ?? null,
          enrollmentBatchId: enrollment?.batchId ?? null,
          enrollmentStatus: enrollment?.status ?? null,
          enrollmentId: enrollment?.id ?? null,
        });
        enrollmentsQuery.refetch();
        progressQuery.refetch();
        toast.error(
          "This lesson belongs to a different batch than your enrollment. " +
            "Please contact admin.",
          { duration: 6000 }
        );
      } else {
        toast.error(message);
      }
    },
  });

  const handleMarkComplete = () => {
    if (completeMutation.isPending) return;

    const lesson = currentFlatLesson;
    const lessonId = lesson?.lessonId;
    const urlLessonId = searchParams.get("lesson");

    console.log("=== MARK COMPLETE PAYLOAD ===");
    console.log("Full payload:", { learnerId, lessonId });
    console.log("user object:", user);
    console.log("user.id:", user?.id);
    console.log("currentFlatLesson:", lesson);
    console.log("currentLesson (GET /lessons/:id):", currentLesson);
    console.log("currentLesson.id:", currentLesson?.id);
    console.log("currentLesson.module.batchId:", currentLesson?.module?.batchId);
    console.log("enrollment.batchId:", enrollment?.batchId ?? null);
    console.log("URL lesson param:", urlLessonId);
    console.log("===========================");

    if (!user?.id) {
      toast.error("Please login again");
      return;
    }
    if (!lesson || !lessonId) {
      toast.error("Lesson not loaded");
      return;
    }
    if (urlLessonId && lessonId !== urlLessonId) {
      console.error("Lesson mismatch!", {
        currentLessonId: lessonId,
        urlLessonId,
      });
    }

    completeMutation.mutate({ learnerId: user.id, lessonId });
  };

  const handleQuizComplete = () => {
    if (currentFlatLesson) handleMarkComplete();
  };

  // ─────────────────────────────────────────────
  // Manual "Refresh Progress" — re-POSTs /progress/complete
  // for EVERY completed lesson to force the backend to
  // re-run its unlock logic (heals orphaned lessons).
  // ─────────────────────────────────────────────
  const [manualHealLoading, setManualHealLoading] = useState(false);

  const handleManualHeal = async () => {
    if (!learnerId) {
      toast.error("Please login again");
      return;
    }
    setManualHealLoading(true);
    toast.loading("Checking for unlock issues...", { id: "heal" });
    try {
      const modules = progress?.modules ?? [];
      const allCompleted: { id: string; order: number }[] = [];

      for (const mod of modules) {
        for (const lesson of mod.lessons ?? []) {
          if (lesson.progress?.isCompleted === true && lesson.id) {
            allCompleted.push({ id: lesson.id, order: lesson.order ?? 0 });
          }
        }
      }
      allCompleted.sort((a, b) => a.order - b.order);

      console.log("Manual heal for lessons:", allCompleted.map((l) => l.id));

      // Re-POST /progress/complete for each completed lesson so the
      // backend re-runs its unlock logic.
      for (const lesson of allCompleted) {
        await apiFetch("/progress/complete", {
          method: "POST",
          body: {
            learnerId: user!.id,
            lessonId: lesson.id,
          },
        }).catch((err) =>
          console.warn("Heal failed:", lesson.id, err)
        );
      }

      await queryClient.invalidateQueries({
        queryKey: ["progress", user!.id, courseId],
      });

      toast.success("Progress refreshed", { id: "heal" });
    } catch (error) {
      toast.error("Failed to refresh progress", { id: "heal" });
      console.error(error);
    } finally {
      setManualHealLoading(false);
    }
  };

  const handleLessonClick = (lessonId: string) => {
    const lesson = flatLessons.find((item) => item.lessonId === lessonId);
    if (!lesson) {
      toast.error("Lesson data missing");
      return;
    }
    if (!lesson.isAccessible) {
      if (lesson.isUnlocked) {
        toast.error(
          "This lesson isn't available yet — it opens on its scheduled date."
        );
        return;
      }

      // Locked: if the previous lesson (by order in the same module) is already
      // completed, the backend likely missed the unlock event (e.g. admin added
      // this lesson after the learner completed its predecessor). Re-trigger
      // /progress/complete on the previous lesson to force the unlock.
      const mod = (progress?.modules ?? []).find((m) =>
        (m.lessons ?? []).some((l) => l.id === lessonId)
      );

      if (mod) {
        const sorted = (mod.lessons ?? [])
          .slice()
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        const index = sorted.findIndex((l) => l.id === lessonId);

        if (index > 0) {
          const prev = sorted[index - 1];
          if (prev.progress?.isCompleted === true && prev.id) {
            toast.loading("Unlocking...", { id: "unlock" });
            apiFetch("/progress/complete", {
              method: "POST",
              body: { learnerId, lessonId: prev.id },
            })
              .then(() => {
                toast.dismiss("unlock");
                toast.success("Unlocked! Refreshing...");
                queryClient.invalidateQueries({
                  queryKey: ["progress", learnerId, courseId],
                });
              })
              .catch((err) => {
                toast.dismiss("unlock");
                toast.error(
                  "Failed to unlock: " +
                    (err instanceof Error ? err.message : "unknown")
                );
              });
            return;
          }
        }
      }

      toast.error("Complete all previous lessons to unlock this one");
      return;
    }
    goToLesson(lessonId);
  };

  // ─────────────────────────────────────────────
  // Render states
  // ─────────────────────────────────────────────
  if (authLoading || enrollmentsQuery.isLoading) {
    return <PageSkeleton />;
  }

  if (enrollmentsQuery.isError) {
    return (
      <ErrorCard
        title="Couldn't load your enrollments"
        message={
          enrollmentsQuery.error instanceof Error
            ? enrollmentsQuery.error.message
            : "Something went wrong. Please try again."
        }
        onRetry={() => enrollmentsQuery.refetch()}
      />
    );
  }

  // No enrollment for this course → the redirect effect will navigate away.
  if (!enrollment) {
    return <PageSkeleton />;
  }

  if (progressQuery.isPending) {
    return <PageSkeleton />;
  }

  if (progressQuery.isError || courseQuery.isError) {
    return (
      <ErrorCard
        title="Couldn't load this course"
        message={
          progressQuery.error instanceof Error
            ? progressQuery.error.message
            : courseQuery.error instanceof Error
              ? courseQuery.error.message
              : "Something went wrong. Please try again."
        }
        onRetry={() => {
          progressQuery.refetch();
          courseQuery.refetch();
          lessonQuery.refetch();
          enrollmentsQuery.refetch();
        }}
      />
    );
  }

  if (totalLessons === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-muted/30 p-12 text-center">
        <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <BookOpen className="size-7" />
        </span>
        <div>
          <h3 className="font-semibold">This course has no content yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Check back later or contact your instructor.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/learner/courses")}>
          <ArrowLeft className="size-4" />
          Back to My Courses
        </Button>
      </div>
    );
  }

  if (!currentFlatLesson) {
    return <PageSkeleton />;
  }

  const showQuiz = currentFlatLesson.type === "QUIZ";

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => router.push("/learner/courses")}
          aria-label="Back to my courses"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold tracking-tight">
            {course?.title ?? "Course"}
          </h1>
          <p className="truncate text-xs text-muted-foreground">
            {currentFlatLesson.moduleTitle} · Lesson{" "}
            {totalLessons > 0 ? currentIndex + 1 : 0} of {totalLessons}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleManualHeal}
            disabled={manualHealLoading}
          >
            {manualHealLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Refresh Progress
          </Button>
          <Progress value={headerPercent} className="h-2 w-24" />
          <span className="text-xs font-medium text-muted-foreground">
            {headerPercent}%
          </span>
        </div>
      </div>

      {isCourseComplete ? (
        isBatchLocked ? (
          <div className="flex flex-col items-start gap-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 p-5 text-white sm:flex-row sm:items-center">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/20">
              <Hourglass className="size-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold">Course Finished!</p>
              <p className="mt-0.5 text-sm text-white/90">
                Your certificate will be available once the instructor marks
                this batch as complete. You&apos;ll be notified.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 p-5 text-white sm:flex-row sm:items-center">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/20">
              <Sparkles className="size-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold">Congratulations!</p>
              <p className="mt-0.5 text-sm text-white/90">
                You&apos;ve completed this course. Your certificate is ready!
              </p>
            </div>
            <Button
              className="bg-white text-emerald-700 hover:bg-white/90"
              nativeButton={false}
              render={<Link href="/learner/certificates" />}
            >
              Get Your Certificate
              <ArrowRight className="size-4" />
            </Button>
          </div>
        )
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* ─── Main content ─── */}
        <div className="min-w-0 space-y-6">
          {!currentFlatLesson.isAccessible ? (
            <LockedLessonNotice
              title={currentFlatLesson.title}
              unlockPending={unlockMutation.isPending}
              unlockError={unlockError}
              onRetryUnlock={() => {
                unlockAttemptedRef.current = false;
                unlockMutation.mutate();
              }}
            />
          ) : lessonQuery.isError ? (
            <ErrorCard
              title="Couldn't load this lesson"
              message={
                lessonQuery.error instanceof Error
                  ? lessonQuery.error.message
                  : "Something went wrong. Please try again."
              }
              onRetry={() => lessonQuery.refetch()}
            />
          ) : lessonQuery.isLoading || !currentLesson ? (
            <LessonContentSkeleton />
          ) : currentFlatLesson.type === "VIDEO" ? (
            <div className="space-y-5">
              <VideoPlayer
                videoId={currentLesson.videoId ?? ""}
                provider={currentLesson.provider ?? "youtube"}
                title={currentLesson.title}
              />
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-bold tracking-tight">
                    {currentLesson.title}
                  </h2>
                  {currentLesson.duration != null ? (
                    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="size-4" />
                      {formatDuration(currentLesson.duration)}
                    </span>
                  ) : null}
                </div>
                {currentLesson.description ? (
                  <div className="prose prose-slate max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {currentLesson.description}
                    </ReactMarkdown>
                  </div>
                ) : null}
              </div>
            </div>
          ) : currentFlatLesson.type === "TEXT" ? (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">
                {currentLesson.title}
              </h2>
              {currentLesson.description ? (
                <p className="text-muted-foreground">{currentLesson.description}</p>
              ) : null}
              <div className="rounded-xl border bg-card p-5 sm:p-8">
                {currentLesson.content ? (
                  <div className="prose prose-slate max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {currentLesson.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No content available for this lesson yet.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">
                {currentLesson.title}
              </h2>
              <QuizPlayer
                lessonId={currentLesson.id}
                onComplete={handleQuizComplete}
              />
            </div>
          )}

          {/* ─── Action bar (hidden for quizzes; QuizPlayer has its own) ─── */}
          {!showQuiz && currentFlatLesson.isAccessible ? (
            <div className="flex items-center justify-between gap-2 rounded-xl border bg-card p-3">
              <Button
                variant="outline"
                disabled={!previousLesson}
                onClick={() => previousLesson && goToLesson(previousLesson.lessonId)}
              >
                <ChevronLeft className="size-4" />
                Previous
              </Button>

              {currentFlatLesson.isCompleted ? (
                <Button
                  variant="secondary"
                  className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50 disabled:opacity-100"
                  disabled
                >
                  <CheckCircle2 className="size-4" />
                  Completed
                </Button>
              ) : (
                <Button
                  className="bg-emerald-600 text-white hover:bg-emerald-600/90"
                  onClick={handleMarkComplete}
                  disabled={completeMutation.isPending}
                >
                  {completeMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )}
                  Mark as Complete
                </Button>
              )}

              <Button
                variant="outline"
                disabled={!nextLesson || !nextLesson.isAccessible}
                onClick={() => nextLesson && goToLesson(nextLesson.lessonId)}
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          ) : null}
        </div>

        {/* ─── Curriculum sidebar ─── */}
        <CurriculumSidebar
          modules={progress?.modules ?? []}
          lessonMeta={lessonMeta}
          currentLessonId={currentLessonId ?? ""}
          openModules={openModules}
          onToggleModule={(moduleId) =>
            setOpenModules((prev) => {
              const next = new Set(prev ?? []);
              if (next.has(moduleId)) next.delete(moduleId);
              else next.add(moduleId);
              return next;
            })
          }
          onLessonClick={handleLessonClick}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Curriculum sidebar
// ─────────────────────────────────────────────
function CurriculumSidebar({
  modules,
  lessonMeta,
  currentLessonId,
  openModules,
  onToggleModule,
  onLessonClick,
}: {
  modules: ProgressModule[];
  lessonMeta: Map<string, { duration: number | null; isFree: boolean }>;
  currentLessonId: string;
  openModules: Set<string>;
  onToggleModule: (moduleId: string) => void;
  onLessonClick: (lessonId: string) => void;
}) {
  if (modules.length === 0) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  return (
    <aside className="space-y-3 rounded-xl bg-slate-50 p-3 lg:sticky lg:top-16 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto">
      <p className="px-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        Curriculum
      </p>
      {modules.map((module) => {
        const lessons = module.lessons ?? [];
        const completed = lessons.filter((l) => l.progress?.isCompleted).length;
        const isOpen = openModules.has(module.id);

        return (
          <div
            key={module.id}
            className="overflow-hidden rounded-lg border bg-white"
          >
            <button
              type="button"
              onClick={() => onToggleModule(module.id)}
              className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-medium">
                  {module.title}
                </span>
                <Badge variant="secondary" className="shrink-0">
                  {completed}/{lessons.length}
                </Badge>
              </span>
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-slate-400 transition-transform",
                  isOpen && "rotate-180"
                )}
              />
            </button>

            {isOpen ? (
              <ul className="divide-y border-t">
                {lessons.map((lesson) => {
                  if (!lesson.id) return null;
                  const lessonId = lesson.id;
                  const isCompleted = Boolean(lesson.progress?.isCompleted);
                  const isUnlocked =
                    Boolean(lesson.progress?.isUnlocked) || isCompleted;
                  const isAccessible =
                    isUnlocked &&
                    (!lesson.availableAt ||
                      new Date(lesson.availableAt).getTime() <= Date.now());
                  const isCurrent = lessonId === currentLessonId;
                  const meta = lessonMeta.get(lessonId) ?? {
                    duration: null,
                    isFree: false,
                  };

                  return (
                    <li
                      key={lessonId}
                      className={cn(
                        "border-l-4",
                        isCurrent
                          ? "border-l-primary bg-primary/10"
                          : "border-l-transparent"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => onLessonClick(lessonId)}
                        className="flex w-full min-w-0 items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                        ) : isAccessible ? (
                          <PlayCircle className="size-4 shrink-0 text-blue-500" />
                        ) : (
                          <Lock className="size-4 shrink-0 text-slate-400" />
                        )}
                        <span
                          className={cn(
                            "min-w-0 flex-1 truncate text-sm",
                            isCurrent
                              ? "font-semibold text-primary"
                              : isAccessible
                                ? "text-slate-700"
                                : "text-slate-500"
                          )}
                        >
                          {lesson.title}
                        </span>
                        {meta.isFree ? (
                          <Badge
                            variant="outline"
                            className="shrink-0 bg-green-50 text-green-700"
                          >
                            Free
                          </Badge>
                        ) : null}
                        <LessonTypeIcon
                          type={lesson.type}
                          className="size-3.5 shrink-0"
                        />
                        {lesson.type === "VIDEO" && meta.duration != null ? (
                          <span className="inline-flex shrink-0 items-center gap-1 text-xs text-slate-400">
                            <Clock className="size-3" />
                            {formatDuration(meta.duration)}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        );
      })}
    </aside>
  );
}

// ─────────────────────────────────────────────
// Skeletons
// ─────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-9 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-2/3 max-w-sm" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Skeleton className="h-2 w-24 rounded-full" />
          <Skeleton className="h-4 w-8" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <Skeleton className="aspect-video w-full rounded-lg" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <div className="hidden space-y-3 lg:block">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function LessonContentSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="aspect-video w-full rounded-lg" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}
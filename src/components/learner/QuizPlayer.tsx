"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Loader2,
  RefreshCw,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { cn } from "cn";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { QuizListData } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";

type Phase = "loading" | "playing" | "submitting" | "result";

interface QuizResultBreakdown {
  quizId: string;
  question: string;
  yourAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

interface QuizSubmitResult {
  total: number;
  correct: number;
  wrong: number;
  percentage: number;
  results: QuizResultBreakdown[];
}

function coerceOptions(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === "string" ? item : String(item)));
  }
  return [];
}

function letterFor(index: number): string {
  return String.fromCharCode(65 + index);
}

function gradeFor(percentage: number): { label: string; className: string } {
  if (percentage < 50) return { label: "Fail", className: "text-red-600" };
  if (percentage < 80) return { label: "Pass", className: "text-amber-600" };
  return { label: "Excellent", className: "text-emerald-600" };
}

function ScoreRing({ percentage }: { percentage: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const strokeClass =
    percentage < 50
      ? "text-red-500"
      : percentage < 80
        ? "text-amber-500"
        : "text-emerald-500";

  return (
    <div className="relative size-36">
      <svg className="size-full -rotate-90" viewBox="0 0 128 128">
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          strokeWidth="10"
          className="stroke-muted"
        />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("stroke-current transition-all duration-700", strokeClass)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-3xl font-bold">{percentage}%</p>
        <p className={cn("text-sm font-semibold", gradeFor(percentage).className)}>
          {gradeFor(percentage).label}
        </p>
      </div>
    </div>
  );
}

interface QuizPlayerProps {
  lessonId: string;
  onComplete?: () => void;
}

export function QuizPlayer({ lessonId, onComplete }: QuizPlayerProps) {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>("loading");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizSubmitResult | null>(null);

  const quizzesQuery = useQuery({
    queryKey: ["quizzes", lessonId],
    enabled: Boolean(lessonId),
    queryFn: async () =>
      (await apiFetch<QuizListData>(`/quizzes/lesson/${lessonId}`)).data,
  });

  const quizzes = quizzesQuery.data?.quizzes ?? [];

  useEffect(() => {
    if (quizzesQuery.data && phase === "loading") {
      setPhase("playing");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizzesQuery.data]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("You must be logged in to submit the quiz");
      const payload = {
        learnerId: user.id,
        answers: quizzes.map((quiz) => ({
          quizId: quiz.id,
          selectedAnswer: answers[quiz.id],
        })),
      };
      const res = await apiFetch<QuizSubmitResult>(
        `/quizzes/lesson/${lessonId}/submit`,
        { method: "POST", body: payload }
      );
      if (!res.data) throw new Error("Quiz submission failed. Please try again.");
      return res.data;
    },
    onSuccess: (data) => {
      setResult(data);
      setPhase("result");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not submit quiz");
      setPhase("playing");
    },
  });

  const handleSubmit = () => {
    const unanswered = quizzes.filter((quiz) => !answers[quiz.id]);
    if (unanswered.length > 0) {
      toast.error(
        `Please answer all ${quizzes.length} questions before submitting`
      );
      return;
    }
    setPhase("submitting");
    submitMutation.mutate();
  };

  const handleRetry = () => {
    setAnswers({});
    setResult(null);
    setPhase("playing");
  };

  if (quizzesQuery.isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, index) => (
          <Skeleton key={index} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (quizzesQuery.isError) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <span className="inline-flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="size-6" />
          </span>
          <div>
            <p className="font-semibold">Could not load the quiz</p>
            <p className="text-sm text-muted-foreground">
              {quizzesQuery.error instanceof Error
                ? quizzesQuery.error.message
                : "Something went wrong."}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => quizzesQuery.refetch()}>
            <RefreshCw className="size-4" />
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (quizzes.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
            <HelpCircle className="size-7" />
          </span>
          <div>
            <p className="font-semibold">No questions yet</p>
            <p className="text-sm text-muted-foreground">
              The instructor hasn&apos;t added any questions to this quiz.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (phase === "result" && result) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center gap-6 rounded-2xl border bg-card p-6 sm:flex-row sm:justify-center sm:gap-10">
          <ScoreRing percentage={result.percentage} />
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-semibold">Quiz complete!</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              You scored {result.correct} out of {result.total} question
              {result.total === 1 ? "" : "s"}.
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <Button variant="outline" onClick={handleRetry}>
                <RotateCcw className="size-4" />
                Try Again
              </Button>
              <Button onClick={onComplete}>
                <CheckCircle2 className="size-4" />
                Mark Lesson Complete
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {result.results.map((item, index) => (
            <div
              key={item.quizId}
              className="rounded-xl border bg-card p-4"
            >
              <div className="flex items-start gap-3">
                {item.isCorrect ? (
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" />
                ) : (
                  <XCircle className="mt-0.5 size-5 shrink-0 text-red-500" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {index + 1}. {item.question}
                  </p>
                  <div className="mt-2 space-y-1 text-sm">
                    <p
                      className={cn(
                        item.isCorrect
                          ? "text-emerald-600"
                          : "text-red-600"
                      )}
                    >
                      Your answer: {item.yourAnswer}
                    </p>
                    {!item.isCorrect && (
                      <p className="text-emerald-600">
                        Correct answer: {item.correctAnswer}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const answeredCount = quizzes.filter((quiz) => Boolean(answers[quiz.id])).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Quiz</h3>
          <p className="text-sm text-muted-foreground">
            Answer all {quizzes.length} question
            {quizzes.length === 1 ? "" : "s"} to complete this lesson
          </p>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          {answeredCount}/{quizzes.length} answered
        </span>
      </div>

      {quizzes.map((quiz, index) => (
        <div key={quiz.id} className="space-y-3 rounded-xl border bg-card p-4">
          <p className="font-medium">
            {index + 1}. {quiz.question}
          </p>
          <RadioGroup
            value={answers[quiz.id]}
            onValueChange={(value) =>
              setAnswers((prev) => ({ ...prev, [quiz.id]: String(value) }))
            }
            className="gap-2"
          >
            {coerceOptions(quiz.options).map((option, optionIndex) => (
              <label
                key={optionIndex}
                className="flex cursor-pointer items-center gap-2 rounded-md p-2 text-sm transition-colors hover:bg-muted/60"
              >
                <RadioGroupItem value={option} />
                <span>
                  {letterFor(optionIndex)}) {option}
                </span>
              </label>
            ))}
          </RadioGroup>
        </div>
      ))}

      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={phase === "submitting" || answeredCount !== quizzes.length}
        >
          {phase === "submitting" ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Quiz"
          )}
        </Button>
      </div>
    </div>
  );
}
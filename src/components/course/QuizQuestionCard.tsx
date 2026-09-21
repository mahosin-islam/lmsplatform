"use client";

import * as React from "react";
import { Copy, Info, Plus, Trash2, X } from "lucide-react";
import { cn } from "cn";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

const MAX_OPTIONS = 6;

export interface LocalQuizQuestion {
  id?: string;
  question: string;
  options: string[];
  correctAnswer: string;
  order: number;
  isNew?: boolean;
  isDirty?: boolean;
}

export interface QuizQuestionErrors {
  question?: string;
  options?: string;
  correctAnswer?: string;
}

function letterFor(index: number): string {
  return String.fromCharCode(65 + index);
}

export function QuizQuestionCard({
  question,
  index,
  onChange,
  onDelete,
  onDuplicate,
  errors,
}: {
  question: LocalQuizQuestion;
  index: number;
  onChange: (updated: LocalQuizQuestion) => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  errors?: QuizQuestionErrors;
}) {
  const correctIndex = question.options.findIndex(
    (option) => option === question.correctAnswer
  );

  const updateOption = (optionIndex: number, value: string) => {
    const wasCorrect = question.options[optionIndex] === question.correctAnswer;
    const options = question.options.map((option, idx) =>
      idx === optionIndex ? value : option
    );
    onChange({
      ...question,
      options,
      correctAnswer: wasCorrect ? value : question.correctAnswer,
    });
  };

  const removeOption = (optionIndex: number) => {
    if (question.options.length <= 2) return;
    const removed = question.options[optionIndex];
    const options = question.options.filter((_, idx) => idx !== optionIndex);
    onChange({
      ...question,
      options,
      correctAnswer:
        removed === question.correctAnswer ? "" : question.correctAnswer,
    });
  };

  const addOption = () => {
    if (question.options.length >= MAX_OPTIONS) return;
    onChange({ ...question, options: [...question.options, ""] });
  };

  const selectCorrect = (value: string | null | undefined) => {
    if (value === null || value === undefined) return;
    const optionIndex = Number(value);
    const next = question.options[optionIndex];
    if (next === undefined || next.trim() === "") return;
    onChange({ ...question, correctAnswer: next });
  };

  return (
    <Card
      className={cn(
        "transition-colors",
        errors ? "ring-destructive/40" : undefined
      )}
    >
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className="bg-indigo-100 text-indigo-700"
            >
              Q{index + 1}
            </Badge>
            <span className="text-sm font-medium text-muted-foreground">
              Question {index + 1}
            </span>
            {question.isNew ? (
              <Badge className="bg-emerald-100 text-emerald-700">New</Badge>
            ) : null}
            {question.isDirty ? (
              <Badge className="bg-amber-100 text-amber-700">Unsaved</Badge>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {onDuplicate ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={onDuplicate}
                aria-label={`Duplicate question ${index + 1}`}
              >
                <Copy className="size-4" />
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onDelete}
              aria-label={`Delete question ${index + 1}`}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium">Question</span>
          <Textarea
            value={question.question}
            onChange={(event) =>
              onChange({ ...question, question: event.target.value })
            }
            rows={2}
            placeholder="e.g. How many vowels are there in English?"
            aria-invalid={Boolean(errors?.question)}
            aria-label={`Question ${index + 1} text`}
          />
          {errors?.question ? (
            <p className="text-xs text-destructive">{errors.question}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium">Options</span>
          <RadioGroup
            value={correctIndex >= 0 ? String(correctIndex) : undefined}
            onValueChange={selectCorrect}
            className="gap-2"
            aria-label={`Correct answer for question ${index + 1}`}
          >
            {question.options.map((option, optionIndex) => {
              const letter = letterFor(optionIndex);
              return (
                <div
                  key={optionIndex}
                  className="flex items-center gap-2"
                >
                  <RadioGroupItem
                    value={String(optionIndex)}
                    disabled={option.trim() === ""}
                    aria-label={`Mark option ${letter} as correct`}
                  />
                  <span className="w-5 shrink-0 text-sm font-semibold text-muted-foreground">
                    {letter})
                  </span>
                  <Input
                    value={option}
                    onChange={(event) =>
                      updateOption(optionIndex, event.target.value)
                    }
                    placeholder={`Option ${letter}`}
                    aria-label={`Option ${letter}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeOption(optionIndex)}
                    disabled={question.options.length <= 2}
                    aria-label={`Remove option ${letter}`}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              );
            })}
          </RadioGroup>
          {errors?.options ? (
            <p className="text-xs text-destructive">{errors.options}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addOption}
            disabled={question.options.length >= MAX_OPTIONS}
          >
            <Plus className="size-4" />
            Add Option
          </Button>
          {question.options.length >= MAX_OPTIONS ? (
            <span className="text-xs text-muted-foreground">
              Maximum {MAX_OPTIONS} options
            </span>
          ) : null}
        </div>

        {errors?.correctAnswer ? (
          <p className="flex items-center gap-1.5 text-xs text-destructive">
            <Info className="size-3.5 shrink-0" />
            {errors.correctAnswer}
          </p>
        ) : (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="size-3.5 shrink-0" />
            Select the radio next to the correct answer.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

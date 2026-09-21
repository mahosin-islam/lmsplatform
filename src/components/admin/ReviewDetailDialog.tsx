"use client";

import * as React from "react";
import Link from "next/link";
import { Star, Trash2 } from "lucide-react";
import { cn } from "cn";

import { formatDate } from "@/lib/course-utils";
import type { Review } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function getUserInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase() || "?";
}

export function Stars({
  value,
  size = "size-4",
  className,
}: {
  value: number;
  size?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      aria-label={`${value} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={cn(
            size,
            index < Math.round(value)
              ? "fill-amber-400 text-amber-400"
              : "fill-slate-200 text-slate-200"
          )}
        />
      ))}
    </div>
  );
}

export function ReviewDetailDialog({
  open,
  onOpenChange,
  review,
  learnerEmail,
  onRequestDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: Review | null;
  learnerEmail?: string;
  onRequestDelete?: () => void;
}) {
  return (
    <Dialog open={open && Boolean(review)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Review details</DialogTitle>
          <DialogDescription>
            Full review from a learner
          </DialogDescription>
        </DialogHeader>

        {review ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="size-11">
                {review.learner?.avatar ? (
                  <AvatarImage
                    src={review.learner.avatar}
                    alt={review.learner?.name ?? "Student"}
                  />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {getUserInitials(review.learner?.name ?? "?")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {review.learner?.name ?? "Unknown"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {learnerEmail || "\u2014"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {review.course?.title ?? "Course"}
                </p>
                {review.course?.slug ? (
                  <Link
                    href={`/courses/${review.course.slug}`}
                    className="text-xs text-primary hover:underline"
                    target="_blank"
                  >
                    View course
                  </Link>
                ) : null}
              </div>
              <Stars value={review.rating} size="size-5" />
            </div>

            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm whitespace-pre-wrap">
                {review.comment || "No comment left with this review."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="rounded-lg border p-2">
                <p className="font-medium text-foreground">Posted</p>
                <p>{formatDate(review.createdAt)}</p>
              </div>
              <div className="rounded-lg border p-2">
                <p className="font-medium text-foreground">Last updated</p>
                <p>{formatDate(review.updatedAt)}</p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={onRequestDelete}
              >
                <Trash2 className="size-4" />
                Delete Review
              </Button>
              <Button size="sm" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertCircle,
  ExternalLink,
  Eye,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  RefreshCw,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { cn } from "cn";

import { apiFetch } from "@/lib/api";
import { timeAgo } from "@/lib/course-utils";
import { useLearnerList } from "@/hooks/use-learner-list";
import type { Course, CourseListData, Review, ReviewListData } from "@/types";
import { ReviewDetailDialog, Stars } from "@/components/admin/ReviewDetailDialog";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface CombinedReview extends Review {
  courseTitle: string;
  courseSlug: string;
  learnerEmail?: string;
}

function getUserInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase() || "?";
}

function StarRatingFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select
      value={value}
      onValueChange={(next) => onChange(next ?? "all")}
    >
      <SelectTrigger id="rating-filter" className="w-28" aria-label="Filter by rating">
        <SelectValue>
          {(value: string) => (value === "all" ? "All ratings" : `${value} \u2605`)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All ratings</SelectItem>
        {["5", "4", "3", "2", "1"].map((rating) => (
          <SelectItem key={rating} value={rating}>
            {rating} \u2605
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ReviewComment({ text }: { text: string | null }) {
  const [expanded, setExpanded] = React.useState(false);
  const showToggle = (text?.length ?? 0) > 120;
  return (
    <div>
      <p
        className={cn(
          "text-sm leading-relaxed",
          !expanded && showToggle && "line-clamp-3"
        )}
      >
        &ldquo;{text || "No comment left with this review."}&rdquo;
      </p>
      {showToggle ? (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-1 text-xs font-medium text-primary hover:underline"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </div>
  );
}

export default function AdminReviewsPage() {
  const queryClient = useQueryClient();
  const [courseFilter, setCourseFilter] = React.useState("all");
  const [ratingFilter, setRatingFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [selectedReview, setSelectedReview] = React.useState<CombinedReview | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<CombinedReview | null>(null);

  const coursesQuery = useQuery({
    queryKey: ["courses"],
    queryFn: async () =>
      (
        await apiFetch<CourseListData>(
          "/courses"
        )
      ).data,
  });

  const reviewsQuery = useQuery({
    queryKey: ["reviews", "all"],
    enabled: Boolean(coursesQuery.data),
    queryFn: async (): Promise<CombinedReview[]> => {
      const courses =
        queryClient.getQueryData<CourseListData>(["courses"])?.courses ?? [];

      const courseReviews = await Promise.all(
        courses.map(async (course) => {
          const data = await apiFetch<ReviewListData>(
            `/reviews/course/${course.id}`
          );
          return (data.data?.reviews ?? []).map((review) => ({
            ...review,
            courseTitle: course.title,
            courseSlug: course.slug,
          }));
        })
      );

      return courseReviews.flat();
    },
  });

  const learners = useLearnerList();

  const reviews = React.useMemo<CombinedReview[]>(() => {
    const emailByLearner = new Map(
      learners.learners.map((learner) => [learner.id, learner.email])
    );
    return (reviewsQuery.data ?? []).map((review) => ({
      ...review,
      learnerEmail: review.learnerId
        ? (emailByLearner.get(review.learnerId) ?? "")
        : "",
    }));
  }, [reviewsQuery.data, learners.learners]);

  const stats = React.useMemo(() => {
    const total = reviews.length;
    const average =
      total > 0
        ? Number(
            (reviews.reduce((sum, review) => sum + review.rating, 0) / total).toFixed(1)
          )
        : 0;
    const coursesReviewed = new Set(reviews.map((review) => review.courseId)).size;
    const lowRatings = reviews.filter((review) => review.rating <= 2).length;
    return { average, total, coursesReviewed, lowRatings };
  }, [reviews]);

  const filtered = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    return reviews.filter((review) => {
      if (courseFilter !== "all" && review.courseId !== courseFilter) {
        return false;
      }
      if (ratingFilter !== "all" && review.rating !== Number(ratingFilter)) {
        return false;
      }
      if (needle) {
        const haystack =
          `${review.learner?.name ?? ""} ${review.comment ?? ""}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [reviews, courseFilter, ratingFilter, search]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) =>
      apiFetch(`/reviews/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Review deleted");
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      setPendingDelete(null);
      setSelectedReview(null);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not delete review"
      );
    },
  });

  const refresh = () => {
    coursesQuery.refetch();
    reviewsQuery.refetch();
    learners.refetch();
  };

  const isLoading = coursesQuery.isLoading || reviewsQuery.isLoading;
  const isError = coursesQuery.isError || reviewsQuery.isError;

  const statCards = [
    {
      label: "Avg Rating",
      value: stats.average.toFixed(1),
      icon: Star,
      tint: "bg-amber-100 text-amber-600",
    },
    {
      label: "Total Reviews",
      value: String(stats.total),
      icon: MessageSquare,
      tint: "bg-blue-100 text-blue-600",
    },
    {
      label: "Courses Reviewed",
      value: String(stats.coursesReviewed),
      icon: ExternalLink,
      tint: "bg-violet-100 text-violet-600",
    },
    {
      label: "Low Ratings (1-2\u2605)",
      value: String(stats.lowRatings),
      icon: AlertCircle,
      tint: "bg-red-100 text-red-600",
    },
  ];

  const courses = coursesQuery.data?.courses ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
          <p className="text-sm text-muted-foreground">
            Monitor feedback across all courses
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={isLoading || learners.loading}
        >
          <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardContent className="flex items-center gap-3 p-4">
                <span
                  className={cn(
                    "inline-flex size-10 shrink-0 items-center justify-center rounded-lg",
                    card.tint
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xl font-bold tabular-nums">
                    {card.value}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {card.label}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select
          value={courseFilter}
          onValueChange={(value) => setCourseFilter(value ?? "all")}
        >
          <SelectTrigger
            id="course-filter"
            className="w-full sm:w-60"
            aria-label="Filter by course"
          >
            <SelectValue>
              {(value: string) =>
                value === "all"
                  ? "All Courses"
                  : (courses.find((course) => course.id === value)?.title ??
                    "All Courses")
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courses.map((course: Course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <StarRatingFilter value={ratingFilter} onChange={setRatingFilter} />

        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search comments or learners..."
            className="pl-8"
            aria-label="Search reviews"
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length} review{filtered.length === 1 ? "" : "s"}
        {search ? ` matching \u201c${search}\u201d` : ""}
      </p>

      {isError ? (
        <Card className="border-destructive/30">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <span className="inline-flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="size-6" />
            </span>
            <div>
              <p className="font-semibold">Could not load reviews</p>
              <p className="text-sm text-muted-foreground">
                Something went wrong. Try again.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className="size-4" />
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
              <Star className="size-7" />
            </span>
            <div>
              <p className="font-semibold">
                {reviews.length === 0
                  ? "No reviews yet"
                  : "No reviews match your filters"}
              </p>
              <p className="text-sm text-muted-foreground">
                {reviews.length === 0
                  ? "Student feedback will appear here once learners review your courses."
                  : "Try a different course, rating, or search term."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="size-10">
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
                        {review.learnerEmail || "\u2014"}
                      </p>
                    </div>
                  </div>
                  <Stars value={review.rating} />
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-sm">
                  <span className="text-muted-foreground">Course:</span>
                  <Link
                    href={`/courses/${review.courseSlug}`}
                    target="_blank"
                    className="inline-flex min-w-0 items-center gap-1 font-medium text-primary hover:underline"
                  >
                    <span className="truncate">{review.courseTitle}</span>
                    <ExternalLink className="size-3.5 shrink-0" />
                  </Link>
                </div>

                <p className="mt-0.5 text-sm text-muted-foreground">
                  Rating:{" "}
                  <span className="font-semibold tabular-nums text-foreground">
                    {review.rating}/5
                  </span>
                </p>

                <div className="mt-3">
                  <ReviewComment text={review.comment} />
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3">
                  <span
                    className="text-xs text-muted-foreground"
                    title={review.createdAt}
                  >
                    {timeAgo(review.createdAt)}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => setSelectedReview(review)}
                    >
                      <Eye className="size-3.5" />
                      View
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Actions for review by ${review.learner?.name ?? "student"}`}
                          />
                        }
                      >
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setSelectedReview(review)}
                        >
                          <Eye className="size-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          nativeButton={false}
                          render={
                            <Link
                              href={`/courses/${review.courseSlug}`}
                              target="_blank"
                              className="w-full"
                            >
                              <ExternalLink className="size-4" />
                              View Course
                            </Link>
                          }
                        />
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setPendingDelete(review)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="size-4" />
                          Delete Review
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this review?</AlertDialogTitle>
            <AlertDialogDescription>
              The {pendingDelete?.rating}/5 star review from{" "}
              &ldquo;{pendingDelete?.learner?.name ?? "this learner"}&rdquo; on{" "}
              {pendingDelete?.courseTitle ?? "this course"} will be permanently
              removed from the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (pendingDelete) deleteMutation.mutate(pendingDelete.id);
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
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

      <ReviewDetailDialog
        open={Boolean(selectedReview)}
        onOpenChange={(open) => {
          if (!open) setSelectedReview(null);
        }}
        review={selectedReview}
        learnerEmail={selectedReview?.learnerEmail}
        onRequestDelete={() => {
          if (selectedReview) {
            setSelectedReview(null);
            setPendingDelete(selectedReview);
          }
        }}
      />
    </div>
  );
}
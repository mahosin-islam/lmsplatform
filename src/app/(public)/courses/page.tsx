"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  GraduationCap,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { cn } from "cn";

import { apiFetch } from "@/lib/api";
import type { CourseLevel, CourseListData, CourseType } from "@/types";
import { pickBatch } from "@/lib/course-utils";
import { CourseCard } from "@/components/course/CourseCard";
import { BatchCourseCard } from "@/components/course/BatchCourseCard";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SectionHeader } from "@/components/shared/SectionHeader";

const POPULAR_TAGS = ["English", "Spoken", "Grammar", "Writing"];
const GRID = "grid gap-5 sm:grid-cols-2 lg:grid-cols-3";
const PAGE_SIZE = 6;

type SortKey = "newest" | "price-asc" | "price-desc";

const SORT_LABELS: Record<SortKey, string> = {
  newest: "Newest",
  "price-asc": "Price: Low → High",
  "price-desc": "Price: High → Low",
};

const LEVEL_LABELS: Record<"" | CourseLevel, string> = {
  "": "All Levels",
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

const TYPE_LABELS: Record<"" | CourseType, string> = {
  "": "All Types",
  FIXED: "Self-Paced",
  BATCH: "Live Batch",
};

export default function CoursesPage() {
  return (
    <Suspense fallback={<CoursesSkeleton />}>
      <CoursesContent />
    </Suspense>
  );
}

function CoursesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") ?? "";

  const levelParam = searchParams.get("level");
  const level: "" | CourseLevel =
    levelParam === "BEGINNER" ||
    levelParam === "INTERMEDIATE" ||
    levelParam === "ADVANCED"
      ? levelParam
      : "";

  const sortParam = searchParams.get("sort");
  const sort: SortKey =
    sortParam === "price-asc" || sortParam === "price-desc"
      ? sortParam
      : "newest";

  const typeParam = searchParams.get("courseType") ?? searchParams.get("type");
  const courseType: "" | CourseType =
    typeParam === "FIXED" || typeParam === "BATCH" ? typeParam : "";

  const freeOnly = searchParams.get("price") === "free";

  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const res = await apiFetch<CourseListData>("/courses");
      return res.data?.courses ?? [];
    },
  });

  const allCourses = useMemo(() => data ?? [], [data]);

  const updateParams = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([key, value]) => {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    });
    const qs = params.toString();
    router.replace(qs ? `/courses?${qs}` : "/courses", { scroll: false });
  };

  const searched = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allCourses.filter((course) => {
      if (level && course.level !== level) return false;
      if (courseType && course.courseType !== courseType) return false;
      if (freeOnly && course.price !== 0) return false;
      if (q) {
        const haystack = `${course.title} ${course.description}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [allCourses, search, level, courseType, freeOnly]);

  const sorted = useMemo(() => {
    const list = [...searched];
    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    else
      list.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    return list;
  }, [searched, sort]);

  const fixedCourses = useMemo(
    () => sorted.filter((c) => c.courseType === "FIXED"),
    [sorted]
  );

  const batchCourses = useMemo(
    () =>
      sorted
        .filter((c) => c.courseType === "BATCH")
        // A finished batch must never be marketed as "upcoming".
        .filter((c) => pickBatch(c).kind !== "completed")
        .sort((a, b) => {
          const aDate = pickBatch(a).batch?.startDate;
          const bDate = pickBatch(b).batch?.startDate;
          const at = aDate ? new Date(aDate).getTime() : Number.POSITIVE_INFINITY;
          const bt = bDate ? new Date(bDate).getTime() : Number.POSITIVE_INFINITY;
          return at - bt;
        }),
    [sorted]
  );

  const stats = useMemo(() => {
    const students = allCourses.reduce(
      (sum, c) => sum + (c._count?.enrollments ?? 0),
      0
    );
    const reviews = allCourses.reduce(
      (sum, c) => sum + (c._count?.reviews ?? 0),
      0
    );
    return { courses: allCourses.length, students, reviews };
  }, [allCourses]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateParams({ search: searchInput.trim() || null });
  };

  const handleTag = (tag: string) => {
    setSearchInput(tag);
    updateParams({ search: tag, courseType: null });
  };

  const hasActiveFilters = Boolean(
    search || level || courseType || freeOnly || sort !== "newest"
  );

  const showFixedSection = courseType !== "BATCH";
  const showBatchSection = courseType !== "FIXED";
  const fixedList =
    courseType === "FIXED" ? fixedCourses : fixedCourses.slice(0, PAGE_SIZE);
  const batchList =
    courseType === "BATCH" ? batchCourses : batchCourses.slice(0, PAGE_SIZE);

  return (
    <div className="pb-16">
      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/[0.07] via-background to-background">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -left-24 size-72 rounded-full bg-primary/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-10 right-0 size-64 rounded-full bg-brand-teal/10 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-teal/25 bg-brand-teal/10 px-3 py-1 text-xs font-semibold text-brand-teal-strong">
              <GraduationCap className="size-3.5" />
              Self-paced courses &amp; live batches
            </span>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Master English on your own terms
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">
              Pick a self-paced course or join a scheduled batch with live
              support sessions, assignments and a verified certificate.
            </p>

            <form
              onSubmit={handleSearch}
              className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-xl border border-border bg-card p-1.5 shadow-sm transition-shadow focus-within:border-primary/50 focus-within:shadow-md focus-within:ring-4 focus-within:ring-primary/10"
            >
              <span className="pl-3 text-muted-foreground">
                <Search className="size-5" />
              </span>
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search for courses..."
                aria-label="Search courses"
                className="h-11 w-full min-w-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                className="h-11 shrink-0 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Search
              </button>
            </form>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {POPULAR_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTag(tag)}
                  className="rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Stats strip */}
          <dl className="mx-auto mt-12 grid max-w-3xl grid-cols-3 divide-x divide-border rounded-xl border border-border bg-card px-2 py-5 shadow-sm">
            <StatItem
              icon={<BookOpen className="size-4" />}
              value={stats.courses}
              label="Courses"
            />
            <StatItem
              icon={<Users className="size-4" />}
              value={stats.students}
              label="Learners"
            />
            <StatItem
              icon={<GraduationCap className="size-4" />}
              value={stats.reviews}
              label="Reviews"
            />
          </dl>
        </div>
      </section>

      {isError ? (
        <div className="mx-auto mt-16 max-w-md px-4">
          <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card p-10 text-center shadow-sm">
            <span className="inline-flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="size-6" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">Couldn&apos;t load courses</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Something went wrong while fetching the catalog.
              </p>
            </div>
            <Button onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={cn(isFetching && "animate-spin")} />
              Try again
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* ─── STICKY FILTERS ─── */}
          <div className="sticky top-16 z-30 border-b border-border bg-background/85 backdrop-blur-md">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {sorted.length}
                </span>{" "}
                course{sorted.length === 1 ? "" : "s"} found
              </p>
              <div className="flex items-center gap-2">
                <FilterDropdown
                  label={TYPE_LABELS[courseType]}
                  heading="Course type"
                  value={courseType}
                  active={Boolean(courseType)}
                  options={[
                    { value: "", label: "All Types" },
                    { value: "FIXED", label: "Self-Paced" },
                    { value: "BATCH", label: "Live Batch" },
                  ]}
                  onSelect={(value) => updateParams({ courseType: value || null })}
                />
                <FilterDropdown
                  label={LEVEL_LABELS[level]}
                  heading="Level"
                  value={level}
                  active={Boolean(level)}
                  options={[
                    { value: "", label: "All Levels" },
                    { value: "BEGINNER", label: "Beginner" },
                    { value: "INTERMEDIATE", label: "Intermediate" },
                    { value: "ADVANCED", label: "Advanced" },
                  ]}
                  onSelect={(value) => updateParams({ level: value || null })}
                />
                <FilterDropdown
                  label={SORT_LABELS[sort]}
                  heading="Sort by"
                  value={sort}
                  active={sort !== "newest"}
                  options={[
                    { value: "newest", label: "Newest" },
                    { value: "price-asc", label: "Price: Low → High" },
                    { value: "price-desc", label: "Price: High → Low" },
                  ]}
                  onSelect={(value) =>
                    updateParams({ sort: value === "newest" ? null : value })
                  }
                />
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    onClick={() =>
                      router.replace("/courses", { scroll: false })
                    }
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* ─── SELF-PACED ─── */}
          {showFixedSection && (
            <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
              <SectionHeader
                icon={BookOpen}
                eyebrow="Self-paced"
                title="Learn at your own pace"
                description="Start instantly and keep access for life — no fixed schedule required."
              />

              <div className="mt-8">
                {isLoading ? (
                  <SkeletonGrid />
                ) : fixedList.length === 0 ? (
                  <EmptyState
                    icon={<BookOpen className="size-7" />}
                    title="No self-paced courses yet"
                    subtitle="Check back soon!"
                  />
                ) : (
                  <>
                    <div className={GRID}>
                      {fixedList.map((course) => (
                        <CourseCard key={course.id} course={course} />
                      ))}
                    </div>
                    {fixedCourses.length > PAGE_SIZE && !courseType ? (
                      <div className="mt-8 text-center">
                        <Link
                          href="/courses?courseType=FIXED"
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          View all {fixedCourses.length} self-paced courses →
                        </Link>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </section>
          )}

          {/* ─── UPCOMING BATCHES ─── */}
          {showBatchSection && (
            <section className="border-t border-border bg-muted/40">
              <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <SectionHeader
                  icon={Calendar}
                  eyebrow="Live cohorts"
                  title="Upcoming batches"
                  description="Join a scheduled cohort with live classes and peer support."
                />

                <div className="mt-8">
                  {isLoading ? (
                    <SkeletonGrid />
                  ) : batchList.length === 0 ? (
                    <EmptyState
                      icon={<Calendar className="size-7" />}
                      title="No batches scheduled"
                      subtitle="New batches will be announced soon"
                    />
                  ) : (
                    <>
                      <div className={GRID}>
                        {batchList.map((course) => (
                          <BatchCourseCard key={course.id} course={course} />
                        ))}
                      </div>
                      {batchCourses.length > PAGE_SIZE && !courseType ? (
                        <div className="mt-8 text-center">
                          <Link
                            href="/courses?courseType=BATCH"
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            View all {batchCourses.length} live batches →
                          </Link>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function StatItem({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>
      <p className="text-xl font-bold tabular-nums sm:text-2xl">{value}</p>
      <p className="text-xs text-muted-foreground sm:text-sm">{label}</p>
    </div>
  );
}

function FilterDropdown({
  label,
  heading,
  value,
  options,
  active,
  onSelect,
}: {
  label: string;
  heading: string;
  value: string;
  options: { value: string; label: string }[];
  active: boolean;
  onSelect: (value: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            className={cn(active && "border-primary text-foreground")}
          />
        }
      >
        {label}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{heading}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onSelect(option.value)}
            className={cn(
              option.value === value &&
                "bg-accent font-medium text-accent-foreground"
            )}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-card p-12 text-center">
      <span className="inline-flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </span>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className={GRID}>
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-2xl border border-border bg-card"
        >
          <div className="aspect-[16/9] w-full animate-pulse bg-muted" />
          <div className="space-y-3 p-5">
            <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
            <div className="h-5 w-4/5 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CoursesSkeleton() {
  return (
    <div className="pb-16">
      <section className="border-b border-border bg-gradient-to-b from-primary/[0.07] via-background to-background">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <div className="mx-auto h-7 w-56 animate-pulse rounded-full bg-muted" />
            <div className="mx-auto mt-5 h-11 w-3/4 animate-pulse rounded-lg bg-muted" />
            <div className="mx-auto mt-4 h-5 w-1/2 animate-pulse rounded bg-muted" />
            <div className="mx-auto mt-8 h-13 w-full max-w-xl animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SkeletonGrid />
      </div>
    </div>
  );
}

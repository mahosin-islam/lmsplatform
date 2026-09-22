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
import type { CourseLevel, CourseListData } from "@/types";
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

const POPULAR_TAGS = ["English", "Spoken", "Grammar", "Writing"];
const GRID = "grid gap-6 sm:grid-cols-2 lg:grid-cols-3";

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
  const level = (searchParams.get("level") ?? "") as "" | CourseLevel;
  const sort = (searchParams.get("sort") as SortKey | null) ?? "newest";
  const courseType =
    searchParams.get("courseType") ?? searchParams.get("type") ?? "";

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
      if (q) {
        const haystack = `${course.title} ${course.description}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [allCourses, search, level, courseType]);

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
    updateParams({ search: tag });
  };

  const hasActiveFilters = Boolean(search || level || courseType || sort !== "newest");

  return (
    <div className="pb-20">
      {/* SECTION 1: HERO */}
      <section className=" relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-purple-700">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 md:py-24">
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
            Learn Without Limits
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/80 md:text-xl">
            Explore self-paced courses or join live batches
          </p>

          <form
            onSubmit={handleSearch}
            className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-full bg-white p-1.5 shadow-xl shadow-purple-900/20"
          >
            <span className="pl-3 text-muted-foreground">
              <Search className="size-5" />
            </span>
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search for courses..."
              className="h-10 w-full min-w-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              aria-label="Search courses"
            />
            <button
              type="submit"
              className="h-10 shrink-0 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
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
                className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-sm text-white/90 backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2: STATS */}
      <section className="mx-auto mt-5 max-w-5xl px-4 sm:px-6">
        <div className="grid grid-cols-3 gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:gap-6 sm:p-6">
          <StatCard
            icon={<BookOpen className="size-5" />}
            value={stats.courses}
            label="Courses"
          />
          <StatCard
            icon={<Users className="size-5" />}
            value={stats.students}
            label="Students"
          />
          <StatCard
            icon={<GraduationCap className="size-5" />}
            value={stats.reviews}
            label="Reviews"
          />
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
          {/* SECTION 5: STICKY FILTERS */}
          <div className="sticky top-16 z-30 mt-10 border-y bg-background/80 backdrop-blur-md">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {sorted.length}
                </span>{" "}
                course{sorted.length === 1 ? "" : "s"} found
              </p>
              <div className="flex items-center gap-2">
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

          {/* SECTION 3: SELF-PACED */}
          <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
            <SectionHeader
              icon={<BookOpen className="size-5" />}
              title="Self-Paced Courses"
              description="Learn at your own pace, anytime, anywhere"
              action={
                fixedCourses.length > 6 ? (
                  <Link
                    href="/courses?courseType=FIXED"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    View all →
                  </Link>
                ) : null
              }
            />
            {isLoading ? (
              <SkeletonGrid />
            ) : fixedCourses.length === 0 ? (
              <EmptyState
                icon={<BookOpen className="size-7" />}
                title="No self-paced courses yet"
                subtitle="Check back soon!"
              />
            ) : (
              <div className={GRID}>
                {fixedCourses.slice(0, 6).map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            )}
          </section>

          {/* SECTION 4: UPCOMING BATCHES */}
          <section className="mt-16 bg-gradient-to-b from-amber-50/70 to-transparent py-12 dark:from-amber-950/10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <SectionHeader
                icon={<GraduationCap className="size-5" />}
                title="Upcoming Batches"
                description="Join a live cohort, learn with peers"
                action={
                  batchCourses.length > 6 ? (
                    <Link
                      href="/courses?courseType=BATCH"
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      View all →
                    </Link>
                  ) : null
                }
              />
              {isLoading ? (
                <SkeletonGrid />
              ) : batchCourses.length === 0 ? (
                <EmptyState
                  icon={<Calendar className="size-7" />}
                  title="No batches scheduled"
                  subtitle="New batches will be announced soon"
                />
              ) : (
                <div className=" grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {batchCourses.slice(0, 6).map((course) => (
                    <BatchCourseCard key={course.id} course={course} />
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 text-center sm:flex-row sm:gap-3 sm:text-left">
      <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </span>
      <div>
        <p className="text-xl font-bold sm:text-2xl">{value}</p>
        <p className="text-xs text-muted-foreground sm:text-sm">{label}</p>
      </div>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
          <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </span>
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
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
          <Button variant="outline" className={cn(active && "border-primary")}>
            {label}
          </Button>
        }
      />
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
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-muted/30 p-12 text-center">
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
          className="overflow-hidden rounded-2xl border bg-card"
        >
          <div className="aspect-video w-full animate-pulse bg-muted" />
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
    <div className="pb-20">
      <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-purple-700 py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div className="mx-auto h-12 w-3/4 animate-pulse rounded-lg bg-white/20" />
          <div className="mx-auto mt-4 h-6 w-1/2 animate-pulse rounded bg-white/20" />
          <div className="mx-auto mt-8 h-12 w-full max-w-xl animate-pulse rounded-full bg-white/20" />
        </div>
      </section>
      <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
        <SkeletonGrid />
      </div>
    </div>
  );
}

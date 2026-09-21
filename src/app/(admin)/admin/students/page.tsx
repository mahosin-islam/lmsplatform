"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertCircle,
  BookOpen,
  Coins,
  Eye,
  Filter,
  GraduationCap,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Search,
  Trash2,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { cn } from "cn";

import { apiFetch } from "@/lib/api";
import { timeAgo } from "@/lib/course-utils";
import type {
  CourseListData,
  CourseType,
  EnrollmentListData,
  TopStudentsData,
  User,
} from "@/types";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UserListData {
  users: User[];
  total: number;
}

interface CourseEnrollmentStat {
  courseId: string;
  title: string;
  courseType: CourseType;
  price: number;
  count: number;
  activeCount: number;
}

interface BatchEnrollmentStat {
  batchId: string;
  batchNumber: number;
  batchTitle: string;
  courseId: string;
  courseTitle: string;
  coursePrice: number;
  count: number;
}

const TYPE_FILTERS = [
  { value: "all", label: "All Types" },
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
] as const;

function getUserInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase() || "?";
}

function joinedThisMonth(createdAt: string): boolean {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

function uniqueLearnerIds(
  enrollments: { learner?: Pick<User, "id"> | null }[]
): Set<string> {
  const ids = new Set<string>();
  enrollments.forEach((enrollment) => {
    if (enrollment.learner?.id) ids.add(enrollment.learner.id);
  });
  return ids;
}

function CountBar({
  title,
  subtitle,
  count,
  max,
}: {
  title: string;
  subtitle?: string;
  count: number;
  max: number;
}) {
  const width = max > 0 ? (count / max) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-sm">
        <span className="min-w-0 truncate">
          {title}
          {subtitle ? (
            <span className="text-muted-foreground"> {subtitle}</span>
          ) : null}
        </span>
        <span className="shrink-0 font-semibold tabular-nums">{count}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function TypeStat({
  value,
  label,
  iconBg,
}: {
  value: number;
  label: string;
  iconBg: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
      <span
        className={cn(
          "inline-flex size-8 shrink-0 items-center justify-center rounded-lg",
          iconBg
        )}
      >
        <TrendingUp className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-lg font-bold leading-none tabular-nums">{value}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default function AdminStudentsPage() {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [pendingDelete, setPendingDelete] = React.useState<User | null>(null);

  // Analytics filters
  const [courseFilter, setCourseFilter] = React.useState("all");
  const [batchFilter, setBatchFilter] = React.useState("all");
  const [typeFilter, setTypeFilter] = React.useState("all");

  React.useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const learnersQuery = useQuery({
    queryKey: ["learners", "all"],
    queryFn: async () => {
      const res = await apiFetch<UserListData>("/users?role=LEARNER");
      return res.data?.users ?? [];
    },
  });

  const studentsQuery = useQuery({
    queryKey: ["students", courseFilter, batchFilter],
    queryFn: async (): Promise<User[]> => {
      const learnersRes = await apiFetch<UserListData>("/users?role=LEARNER");
      const learners = learnersRes.data?.users ?? [];

      // No course filter → all learners
      if (courseFilter === "all") {
        return learners;
      }

      // Specific batch → learners in that batch
      if (batchFilter !== "all") {
        const res = await apiFetch<EnrollmentListData>(
          `/enrollments/batch/${batchFilter}`
        );
        const ids = uniqueLearnerIds(res.data?.enrollments ?? []);
        return learners.filter((learner) => ids.has(learner.id));
      }

      // Specific course (any batch or FIXED) → learners in that course
      const res = await apiFetch<EnrollmentListData>(
        `/enrollments/course/${courseFilter}`
      );
      const ids = uniqueLearnerIds(res.data?.enrollments ?? []);
      return learners.filter((learner) => ids.has(learner.id));
    },
  });

  const topStudentsQuery = useQuery({
    queryKey: ["admin", "top-students"],
    queryFn: async () =>
      (
        await apiFetch<TopStudentsData>(
          "/dashboard/admin/top-students?limit=5000"
        )
      ).data,
  });

  const analyticsQuery = useQuery({
    queryKey: ["students", "analytics"],
    queryFn: async () => {
      // 1. Get all courses (includes their batches)
      const coursesRes = await apiFetch<CourseListData>("/courses");
      const courses = coursesRes.data?.courses ?? [];

      // 2. Enrollments per course, fetched in parallel
      const courseStats = await Promise.all(
        courses.map(async (course) => {
          const fallback: CourseEnrollmentStat = {
            courseId: course.id,
            title: course.title,
            courseType: course.courseType,
            price: course.price,
            count: 0,
            activeCount: 0,
          };
          try {
            const res = await apiFetch<EnrollmentListData>(
              `/enrollments/course/${course.id}`
            );
            const enrollments = res.data?.enrollments ?? [];
            return {
              ...fallback,
              count: enrollments.length,
              activeCount: enrollments.filter(
                (enrollment) =>
                  enrollment.status === "ACTIVE" ||
                  enrollment.status === "COMPLETED"
              ).length,
            };
          } catch {
            return fallback;
          }
        })
      );

      // 3. Enrollments per batch (BATCH courses only), in parallel
      const batchCourses = courses.filter(
        (course) => course.courseType === "BATCH"
      );
      const batchStats = (
        await Promise.all(
          batchCourses.flatMap((course) =>
            (course.batches ?? []).map(async (batch) => {
              const fallback: BatchEnrollmentStat = {
                batchId: batch.id,
                batchNumber: batch.batchNumber,
                batchTitle: batch.title ?? "",
                courseId: course.id,
                courseTitle: course.title,
                coursePrice: course.price,
                count: 0,
              };
              try {
                const res = await apiFetch<EnrollmentListData>(
                  `/enrollments/batch/${batch.id}`
                );
                const enrollments = res.data?.enrollments ?? [];
                return { ...fallback, count: enrollments.length };
              } catch {
                return fallback;
              }
            })
          )
        )
      )
        .filter((batch) => batch.count > 0)
        .sort((a, b) => b.count - a.count);

      return { courseStats, batchStats };
    },
    staleTime: 2 * 60 * 1000,
  });

  const allLearners = React.useMemo(
    () => learnersQuery.data ?? [],
    [learnersQuery.data]
  );

  const filteredStudents = React.useMemo(() => {
    const list = studentsQuery.data ?? [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (student) =>
        student.name?.toLowerCase().includes(q) ||
        student.email?.toLowerCase().includes(q)
    );
  }, [studentsQuery.data, search]);

  const enrollmentsByUser = React.useMemo(() => {
    const map = new Map<string, number>();
    (topStudentsQuery.data?.students ?? []).forEach((entry) => {
      map.set(entry.userId, entry.totalEnrollments);
    });
    return map;
  }, [topStudentsQuery.data]);

  const stats = React.useMemo(
    () => ({
      total: allLearners.length,
      active: allLearners.filter((student) => (enrollmentsByUser.get(student.id) ?? 0) > 0).length,
      joinedThisMonth: allLearners.filter((student) =>
        joinedThisMonth(student.createdAt)
      ).length,
    }),
    [allLearners, enrollmentsByUser]
  );

  const courseStats = React.useMemo(
    () => analyticsQuery.data?.courseStats ?? [],
    [analyticsQuery.data]
  );
  const batchStats = React.useMemo(
    () => analyticsQuery.data?.batchStats ?? [],
    [analyticsQuery.data]
  );

  // Course select options (respect the Type filter)
  const courseOptions = React.useMemo(() => {
    let list = courseStats;
    if (typeFilter !== "all") {
      list = list.filter((course) =>
        typeFilter === "free" ? course.price === 0 : course.price > 0
      );
    }
    return [...list].sort((a, b) => a.title.localeCompare(b.title));
  }, [courseStats, typeFilter]);

  // Batch select options (respect Type + Course filters)
  const batchOptions = React.useMemo(() => {
    let list = batchStats;
    if (typeFilter !== "all") {
      list = list.filter((batch) =>
        typeFilter === "free" ? batch.coursePrice === 0 : batch.coursePrice > 0
      );
    }
    if (courseFilter !== "all") {
      list = list.filter((batch) => batch.courseId === courseFilter);
    }
    return [...list].sort(
      (a, b) =>
        a.courseTitle.localeCompare(b.courseTitle) ||
        a.batchNumber - b.batchNumber
    );
  }, [batchStats, typeFilter, courseFilter]);

  // If a filter's options disappear, reset it
  React.useEffect(() => {
    if (
      courseFilter !== "all" &&
      !courseOptions.some((course) => course.courseId === courseFilter)
    ) {
      setCourseFilter("all");
    }
  }, [courseOptions, courseFilter]);

  React.useEffect(() => {
    if (
      batchFilter !== "all" &&
      !batchOptions.some((batch) => batch.batchId === batchFilter)
    ) {
      setBatchFilter("all");
    }
  }, [batchOptions, batchFilter]);

  const filteredCourseStats = React.useMemo(() => {
    let list = courseStats;
    if (typeFilter !== "all") {
      list = list.filter((course) =>
        typeFilter === "free" ? course.price === 0 : course.price > 0
      );
    }
    if (courseFilter !== "all") {
      list = list.filter((course) => course.courseId === courseFilter);
    }
    return [...list].sort((a, b) => b.count - a.count).slice(0, 5);
  }, [courseStats, courseFilter, typeFilter]);

  const filteredBatchStats = React.useMemo(() => {
    let list = batchStats;
    if (typeFilter !== "all") {
      list = list.filter((batch) =>
        typeFilter === "free" ? batch.coursePrice === 0 : batch.coursePrice > 0
      );
    }
    if (courseFilter !== "all") {
      list = list.filter((batch) => batch.courseId === courseFilter);
    }
    if (batchFilter !== "all") {
      list = list.filter((batch) => batch.batchId === batchFilter);
    }
    return [...list].sort((a, b) => b.count - a.count).slice(0, 5);
  }, [batchStats, typeFilter, courseFilter, batchFilter]);

  const typeBreakdown = React.useMemo(() => {
    let list = courseStats;
    if (courseFilter !== "all") {
      list = list.filter((course) => course.courseId === courseFilter);
    }
    const free = list
      .filter((course) => course.price === 0)
      .reduce((sum, course) => sum + course.count, 0);
    const paid = list
      .filter((course) => course.price > 0)
      .reduce((sum, course) => sum + course.count, 0);
    const fixed = list
      .filter((course) => course.courseType === "FIXED")
      .reduce((sum, course) => sum + course.count, 0);
    const batched = list
      .filter((course) => course.courseType === "BATCH")
      .reduce((sum, course) => sum + course.count, 0);
    return { free, paid, fixed, batched };
  }, [courseStats, courseFilter]);

  const courseCountTotal = React.useMemo(
    () => filteredCourseStats.reduce((sum, course) => sum + course.count, 0),
    [filteredCourseStats]
  );
  const courseCountActive = React.useMemo(
    () =>
      filteredCourseStats.reduce((sum, course) => sum + course.activeCount, 0),
    [filteredCourseStats]
  );

  const courseMax = React.useMemo(
    () => Math.max(...filteredCourseStats.map((course) => course.count), 1),
    [filteredCourseStats]
  );
  const batchMax = React.useMemo(
    () => Math.max(...filteredBatchStats.map((batch) => batch.count), 1),
    [filteredBatchStats]
  );

  const courseSelectLabel = (value: string) =>
    value === "all"
      ? "All Courses"
      : (courseOptions.find((course) => course.courseId === value)?.title ??
        "All Courses");

  const batchSelectLabel = (value: string) => {
    if (value === "all") return "All Batches";
    const batch = batchOptions.find((item) => item.batchId === value);
    return batch
      ? `${batch.courseTitle} · Batch ${batch.batchNumber}`
      : "All Batches";
  };

  const typeSelectLabel = (value: string) =>
    TYPE_FILTERS.find((item) => item.value === value)?.label ?? "All Types";

  const deleteMutation = useMutation({
    mutationFn: async (id: string) =>
      apiFetch(`/users/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Student removed");
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "top-students"] });
      setPendingDelete(null);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not remove student"
      );
    },
  });

  const refresh = () => {
    learnersQuery.refetch();
    studentsQuery.refetch();
    topStudentsQuery.refetch();
    analyticsQuery.refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Students</h1>
          <p className="text-sm text-muted-foreground">
            All learners on the platform
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={
            studentsQuery.isFetching ||
            topStudentsQuery.isFetching ||
            analyticsQuery.isFetching
          }
        >
          <RefreshCw
            className={cn(
              "size-4",
              (studentsQuery.isFetching ||
                topStudentsQuery.isFetching ||
                analyticsQuery.isFetching) &&
                "animate-spin"
            )}
          />
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <span className="inline-flex size-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <Users className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-2xl font-bold tabular-nums">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Learners</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <span className="inline-flex size-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <UserCheck className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-2xl font-bold tabular-nums">{stats.active}</p>
              <p className="text-xs text-muted-foreground">
                Active (with enrollments)
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <span className="inline-flex size-10 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
              <UserPlus className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-2xl font-bold tabular-nums">
                {stats.joinedThisMonth}
              </p>
              <p className="text-xs text-muted-foreground">Joined This Month</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Enrollment Analytics ─────────────────────────────── */}
      <section className="space-y-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <TrendingUp className="size-5 text-primary" />
            Enrollment Analytics
          </h2>
          <p className="text-sm text-muted-foreground">
            Enrollments broken down by course, batch, and type
          </p>
        </div>

        {analyticsQuery.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-56 w-full rounded-xl" />
            ))}
          </div>
        ) : analyticsQuery.isError ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <span className="inline-flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertCircle className="size-6" />
              </span>
              <div>
                <p className="font-semibold">
                  Could not load enrollment analytics
                </p>
                <p className="text-sm text-muted-foreground">
                  {analyticsQuery.error instanceof Error
                    ? analyticsQuery.error.message
                    : "Something went wrong."}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => analyticsQuery.refetch()}
              >
                <RefreshCw className="size-4" />
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="shadow-none">
              <CardContent className="flex flex-wrap items-center gap-3 p-4">
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                  <Filter className="size-4" />
                  Filters
                </span>
                <Select
                  value={courseFilter}
                  onValueChange={(value) => setCourseFilter(value ?? "all")}
                >
                  <SelectTrigger className="w-full sm:w-52">
                    <SelectValue>{courseSelectLabel}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {courseOptions.map((course) => (
                      <SelectItem key={course.courseId} value={course.courseId}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={batchFilter}
                  onValueChange={(value) => setBatchFilter(value ?? "all")}
                >
                  <SelectTrigger className="w-full sm:w-56">
                    <SelectValue>{batchSelectLabel}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Batches</SelectItem>
                    {batchOptions.map((batch) => (
                      <SelectItem key={batch.batchId} value={batch.batchId}>
                        {batch.courseTitle} · Batch {batch.batchNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={typeFilter}
                  onValueChange={(value) => setTypeFilter(value ?? "all")}
                >
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue>{typeSelectLabel}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_FILTERS.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <BookOpen className="size-4 text-primary" />
                      Enrollments by Course
                    </CardTitle>
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-700"
                    >
                      {courseCountTotal} total
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {filteredCourseStats.length} course
                    {filteredCourseStats.length === 1 ? "" : "s"} ·{" "}
                    {courseCountActive} active
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {filteredCourseStats.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      No enrollment data yet
                    </p>
                  ) : (
                    filteredCourseStats.map((course) => (
                      <CountBar
                        key={course.courseId}
                        title={course.title}
                        count={course.count}
                        max={courseMax}
                      />
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <GraduationCap className="size-4 text-primary" />
                      Enrollments by Batch
                    </CardTitle>
                    {filteredBatchStats.length > 0 ? (
                      <Badge
                        variant="secondary"
                        className="bg-violet-100 text-violet-700"
                      >
                        {filteredBatchStats.reduce(
                          (sum, batch) => sum + batch.count,
                          0
                        )}{" "}
                        total
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {filteredBatchStats.length} batch
                    {filteredBatchStats.length === 1 ? "" : "es"}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {filteredBatchStats.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      No enrollment data yet
                    </p>
                  ) : (
                    filteredBatchStats.map((batch) => (
                      <CountBar
                        key={batch.batchId}
                        title={batch.courseTitle}
                        subtitle={`Batch ${batch.batchNumber}`}
                        count={batch.count}
                        max={batchMax}
                      />
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Coins className="size-4 text-primary" />
                    Enrollments by Type
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Price &amp; delivery breakdown
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <TypeStat
                      value={typeBreakdown.free}
                      label="Free"
                      iconBg="bg-emerald-100 text-emerald-600"
                    />
                    <TypeStat
                      value={typeBreakdown.paid}
                      label="Paid"
                      iconBg="bg-blue-100 text-blue-600"
                    />
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-3">
                    <TypeStat
                      value={typeBreakdown.fixed}
                      label="Self-Paced"
                      iconBg="bg-amber-100 text-amber-600"
                    />
                    <TypeStat
                      value={typeBreakdown.batched}
                      label="Batched"
                      iconBg="bg-violet-100 text-violet-600"
                    />
                  </div>
                  {typeBreakdown.free +
                    typeBreakdown.paid +
                    typeBreakdown.fixed +
                    typeBreakdown.batched ===
                  0 ? (
                    <p className="pt-1 text-center text-sm text-muted-foreground">
                      No enrollment data yet
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-muted-foreground">
            {filteredStudents.length} student
            {filteredStudents.length === 1 ? "" : "s"}
            {search ? ` matching “${search}”` : ""}
          </p>
          {courseFilter !== "all" ? (
            <Badge variant="secondary" className="gap-1">
              Filtered: {courseSelectLabel(courseFilter)}
              {batchFilter !== "all" && ` · ${batchSelectLabel(batchFilter)}`}
            </Badge>
          ) : null}
          {courseFilter !== "all" ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-muted-foreground"
              onClick={() => {
                setCourseFilter("all");
                setBatchFilter("all");
              }}
            >
              <X className="size-3.5" />
              Clear
            </Button>
          ) : null}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search students..."
            className="pl-8"
            aria-label="Search students"
          />
        </div>
      </div>

      {studentsQuery.isError ? (
        <Card className="border-destructive/30">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <span className="inline-flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="size-6" />
            </span>
            <div>
              <p className="font-semibold">Could not load students</p>
              <p className="text-sm text-muted-foreground">
                {studentsQuery.error instanceof Error
                  ? studentsQuery.error.message
                  : "Something went wrong."}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => studentsQuery.refetch()}
            >
              <RefreshCw className="size-4" />
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : studentsQuery.isLoading ? (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Enrollments</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-10 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-8" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="size-7 rounded-md" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : filteredStudents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Users className="size-7" />
            </span>
            <div>
              <p className="font-semibold">
                {courseFilter !== "all"
                  ? "No students enrolled yet"
                  : search
                    ? "No students match your search"
                    : "No students yet"}
              </p>
              <p className="text-sm text-muted-foreground">
                {courseFilter !== "all"
                  ? `No learners have enrolled in ${courseSelectLabel(courseFilter)}${
                      batchFilter !== "all"
                        ? ` · ${batchSelectLabel(batchFilter)}`
                        : ""
                    } yet.`
                  : search
                    ? "Try a different name or email."
                    : "New learners will appear here when they register."}
              </p>
            </div>
            {courseFilter !== "all" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCourseFilter("all");
                  setBatchFilter("all");
                }}
              >
                Show all students
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Enrollments</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => {
                const enrollments = enrollmentsByUser.get(student.id) ?? 0;
                return (
                  <TableRow key={student.id}>
                    <TableCell className="max-w-[280px]">
                      <Link
                        href={`/admin/students/${student.id}`}
                        className="flex items-center gap-3"
                      >
                        <Avatar className="size-10">
                          {student.avatar ? (
                            <AvatarImage
                              src={student.avatar}
                              alt={student.name}
                            />
                          ) : null}
                          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                            {getUserInitials(student.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{student.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {student.email}
                          </p>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                          enrollments > 0
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        )}
                      >
                        {enrollments}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      <span title={student.createdAt}>
                        {timeAgo(student.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Actions for ${student.name}`}
                            />
                          }
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            nativeButton={false}
                            render={
                              <Link
                                href={`/admin/students/${student.id}`}
                                className="w-full"
                              >
                                <Eye className="size-4" />
                                View Profile
                              </Link>
                            }
                          />
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setPendingDelete(student)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove student?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{pendingDelete?.name}&rdquo; will be removed from the
              platform. This action cannot be undone.
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
                  Removing...
                </>
              ) : (
                "Remove"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
"use client";
import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertCircle,
  AlertTriangle,
  Award,
  BookOpen,
  Layers,
  ListTree,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { cn } from "cn";

import { apiFetch } from "@/lib/api";
import { formatDate, formatPrice } from "@/lib/course-utils";
import type { Course, CourseListData, CourseStatus, CourseType } from "@/types";
import { CreateCourseDialog } from "@/components/admin/CreateCourseDialog";
import { ManageCertificatesDialog } from "@/components/admin/ManageCertificatesDialog";
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type CourseTab = "ALL" | CourseType;

const STATUS_BADGE_CLASS: Record<CourseStatus, string> = {
  PUBLISHED: "bg-emerald-100 text-emerald-700",
  DRAFT: "bg-amber-100 text-amber-700",
  ARCHIVED: "bg-slate-200 text-slate-600",
};

const TYPE_BADGE_CLASS: Record<CourseType, string> = {
  FIXED: "bg-blue-100 text-blue-700",
  BATCH: "bg-violet-100 text-violet-700",
};

function typeLabel(type: CourseType): string {
  return type === "FIXED" ? "Self-Paced" : "Batch";
}

function CourseCell({ course }: { course: Course }) {
  return (
    <div className="flex items-center gap-3">
      {course.thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={course.thumbnail}
          alt={course.title}
          className="size-10 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
          <BookOpen className="size-5" />
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate font-medium">{course.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          /{course.slug}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {course.courseType === "BATCH"
            ? `${course._count?.batches ?? 0} batch${
                (course._count?.batches ?? 0) === 1 ? "" : "es"
              } · ${course._count?.modules ?? 0} module${
                (course._count?.modules ?? 0) === 1 ? "" : "s"
              }`
            : `${course._count?.modules ?? 0} module${
                (course._count?.modules ?? 0) === 1 ? "" : "s"
              }`}
        </p>
      </div>
    </div>
  );
}

export default function AdminCoursesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editCourse, setEditCourse] = React.useState<Course | null>(null);
  const [tab, setTab] = React.useState<CourseTab>("ALL");
  const [search, setSearch] = React.useState("");
  const [manageCertCourse, setManageCertCourse] = React.useState<Course | null>(
    null
  );
  const [manageCertOpen, setManageCertOpen] = React.useState(false);

  const coursesQuery = useQuery({
    queryKey: ["admin", "courses"],
    queryFn: async () =>
      (await apiFetch<CourseListData>("/courses")).data,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/courses/${id}`, { method: "DELETE" });
      return res;
    },
    onSuccess: () => {
      toast.success("Course deleted");
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not delete course"
      );
    },
  });

  const courses = React.useMemo(
    () => coursesQuery.data?.courses ?? [],
    [coursesQuery.data]
  );

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return courses.filter((course) => {
      const matchesTab = tab === "ALL" || course.courseType === tab;
      const matchesSearch =
        query.length === 0 ||
        course.title.toLowerCase().includes(query) ||
        course.slug.toLowerCase().includes(query);
      return matchesTab && matchesSearch;
    });
  }, [courses, tab, search]);

  const handleDelete = (course: Course) => {
    const confirmed =
      typeof window === "undefined"
        ? false
        : window.confirm(
            `Delete "${course.title}"? This action cannot be undone.`
          );
    if (confirmed) {
      deleteMutation.mutate(course.id);
    }
  };

  const counts = React.useMemo(
    () => ({
      ALL: courses.length,
      FIXED: courses.filter((c) => c.courseType === "FIXED").length,
      BATCH: courses.filter((c) => c.courseType === "BATCH").length,
    }),
    [courses]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Courses</h1>
          <p className="text-sm text-muted-foreground">
            Create, review and manage every course on the platform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["admin", "courses"] })
            }
            disabled={coursesQuery.isFetching}
          >
            <RefreshCw
              className={cn(
                "size-4",
                coursesQuery.isFetching && "animate-spin"
              )}
            />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            New course
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as CourseTab)}
        >
          <TabsList>
            <TabsTrigger value="ALL">All ({counts.ALL})</TabsTrigger>
            <TabsTrigger value="FIXED">
              Self-Paced ({counts.FIXED})
            </TabsTrigger>
            <TabsTrigger value="BATCH">Batches ({counts.BATCH})</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-64">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search courses..."
            className="pl-8"
            aria-label="Search courses"
          />
        </div>
      </div>

      {coursesQuery.isError ? (
        <Card className="border-destructive/30">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <span className="inline-flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="size-6" />
            </span>
            <div>
              <p className="font-semibold">Could not load courses</p>
              <p className="text-sm text-muted-foreground">
                {coursesQuery.error instanceof Error
                  ? coursesQuery.error.message
                  : "Something went wrong."}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => coursesQuery.refetch()}
            >
              <RefreshCw className="size-4" />
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : coursesQuery.isLoading ? (
        <Card>
          <CardContent className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BookOpen className="size-7" />
            </span>
            <div>
              <p className="font-semibold">
                {courses.length === 0
                  ? "No courses yet"
                  : "No courses match your filters"}
              </p>
              <p className="text-sm text-muted-foreground">
                {courses.length === 0
                  ? "Create your first course to start teaching."
                  : "Try a different tab or search term."}
              </p>
            </div>
            {courses.length === 0 ? (
              <Button size="sm" onClick={() => setDialogOpen(true)}>
                <Plus className="size-4" />
                Create your first course
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="hidden lg:table-cell">Modules</TableHead>
                <TableHead className="hidden lg:table-cell">Batches</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Created</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="max-w-[280px]">
                    <CourseCell course={course} />
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={TYPE_BADGE_CLASS[course.courseType]}
                    >
                      {typeLabel(course.courseType)}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-medium">
                    {formatPrice(course.price)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {course._count?.modules ?? 0}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {course.courseType === "BATCH" ? (
                      <Button
                        size="xs"
                        variant="outline"
                        className={cn(
                          (course._count?.batches ?? 0) === 0 &&
                            "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
                        )}
                        nativeButton={false}
                        render={
                          <Link href={`/admin/courses/${course.id}/batches`} />
                        }
                      >
                        {(course._count?.batches ?? 0) === 0 ? (
                          <>
                            <AlertTriangle className="size-3.5" />
                            No batches
                          </>
                        ) : (
                          <>
                            <Layers className="size-3.5" />
                            {course._count?.batches}{" "}
                            {(course._count?.batches ?? 0) === 1
                              ? "batch"
                              : "batches"}
                          </>
                        )}
                      </Button>
                    ) : (
                      <span className="text-muted-foreground">&mdash;</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={STATUS_BADGE_CLASS[course.status]}
                    >
                      {course.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap text-muted-foreground md:table-cell">
                    {formatDate(course.createdAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Actions for ${course.title}`}
                          />
                        }
                      >
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          nativeButton={false}
                          render={
                            <Link href={`/courses/${course.slug}`}>
                              <BookOpen className="size-4" />
                              View
                            </Link>
                          }
                        />
                        <DropdownMenuItem
                          nativeButton={false}
                          render={
                            <Link href={`/admin/courses/${course.id}/content`}>
                              <ListTree className="size-4" />
                              Manage Content
                            </Link>
                          }
                        />
                        <DropdownMenuItem
                          onClick={() => {
                            setEditCourse(course);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="size-4" />
                          Edit
                        </DropdownMenuItem>
                        {course.courseType === "BATCH" ? (
                          <>
                            <DropdownMenuItem
                              nativeButton={false}
                              render={
                                <Link
                                  href={`/admin/courses/${course.id}/batches`}
                                >
                                  <Layers className="size-4" />
                                  Manage Batches
                                </Link>
                              }
                            />
                            <DropdownMenuItem
                              onClick={() => {
                                setManageCertCourse(course);
                                setManageCertOpen(true);
                              }}
                            >
                              <Award className="size-4 mr-2" />
                              Manage Certificates
                            </DropdownMenuItem>
                          </>
                        ) : null}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => handleDelete(course)}
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending &&
                          deleteMutation.variables === course.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Trash2 className="size-4" />
                          )}
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <CreateCourseDialog
        open={dialogOpen}
        onOpenChange={(next) => {
          setDialogOpen(next);
          if (!next) setEditCourse(null);
        }}
        course={editCourse}
      />

      {manageCertCourse ? (
        <ManageCertificatesDialog
          open={manageCertOpen}
          onOpenChange={setManageCertOpen}
          courseId={manageCertCourse.id}
          courseName={manageCertCourse.title}
        />
      ) : null}
    </div>
  );
}

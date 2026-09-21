"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  GraduationCap,
  HelpCircle,
  Loader2,
  PlayCircle,
  Star,
  Users,
} from "lucide-react";
import { cn } from "cn";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type {
  Course,
  CourseListData,
  EnrollmentListData,
  EnrollmentResponse,
  LessonType,
  Module,
  ReviewListData,
  ReviewStats,
} from "@/types";
import {
  formatDate,
  formatPrice,
  LEVEL_BADGE_CLASS,
} from "@/lib/course-utils";
import { CourseThumbnail } from "@/components/course/CourseThumbnail";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
}

function LessonTypeIcon({ type }: { type: LessonType }) {
  if (type === "VIDEO") return <PlayCircle className="size-4 text-primary" />;
  if (type === "QUIZ") return <HelpCircle className="size-4 text-amber-500" />;
  return <FileText className="size-4 text-blue-500" />;
}

function Stars({ value, size = "size-4" }: { value: number; size?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={cn(
            size,
            index < Math.round(value)
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/30"
          )}
        />
      ))}
    </span>
  );
}

export default function CourseDetailPage() {
  const routeParams = useParams<{ slug: string }>();
  const slug = routeParams?.slug ?? "";
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const courseQuery = useQuery({
    queryKey: ["course", slug],
    enabled: Boolean(slug),
    queryFn: async () => {
      const list = await apiFetch<CourseListData>("/courses");
      const found = list.data?.courses.find((item) => item.slug === slug);
      if (!found) return null;
      const detail = await apiFetch<Course>(`/courses/${found.id}`);
      return detail.data;
    },
  });

  const course = courseQuery.data ?? null;
  const modules = useMemo<Module[]>(() => course?.modules ?? [], [course]);

  const reviewQuery = useQuery({
    queryKey: ["reviews", course?.id],
    enabled: Boolean(course?.id),
    queryFn: async () => {
      const res = await apiFetch<ReviewListData>(`/reviews/course/${course!.id}`);
      return res.data;
    },
  });

  const statsQuery = useQuery({
    queryKey: ["review-stats", course?.id],
    enabled: Boolean(course?.id),
    queryFn: async () => {
      const res = await apiFetch<ReviewStats>(`/reviews/stats/${course!.id}`);
      return res.data;
    },
  });

  const myEnrollQuery = useQuery({
    queryKey: ["my-enrollments", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const res = await apiFetch<EnrollmentListData>(
        `/enrollments/my/${user!.id}`
      );
      return res.data?.enrollments ?? [];
    },
  });

  const existingEnrollment = myEnrollQuery.data?.find(
    (enrollment) => enrollment.courseId === course?.id
  );

  const enrollMutation = useMutation({
    mutationFn: async (batchId?: string) => {
      if (!user || !course) throw new Error("Missing user or course");
      const res = await apiFetch<EnrollmentResponse>("/enrollments", {
        method: "POST",
        body: {
          learnerId: user.id,
          courseId: course.id,
          ...(batchId ? { batchId } : {}),
        },
      });
      if (!res.data) throw new Error("Enrollment failed. Please try again.");
      return res.data;
    },
    onSuccess: (data) => {
      if (data.isFree) {
        toast.success("Enrolled successfully. Happy learning!");
        router.push("/learner/courses");
      } else {
        toast.success("Enrollment created. Complete payment to continue.");
        router.push(`/checkout/${data.enrollment.id}`);
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Enrollment failed."
      );
    },
  });

  const lessonsCount = modules.reduce(
    (total, module) => total + (module.lessons?.length ?? 0),
    0
  );

  const students = course?._count?.enrollments ?? 0;
  const modulesCount = course?._count?.modules ?? modules.length;
  const rating = statsQuery.data?.average ?? reviewQuery.data?.averageRating ?? 0;
  const reviewsCount =
    statsQuery.data?.total ?? reviewQuery.data?.total ?? course?._count?.reviews ?? 0;

  const goToLogin = () => {
    router.push(`/login?redirect=${encodeURIComponent(`/courses/${slug}`)}`);
  };

  const handleEnroll = (batchId?: string) => {
    if (!user) {
      goToLogin();
      return;
    }
    enrollMutation.mutate(batchId);
  };

  const handlePrimaryAction = () => {
    if (!course) return;
    if (existingEnrollment) {
      router.push("/learner/dashboard");
      return;
    }
    if (!user) {
      goToLogin();
      return;
    }
    if (course.courseType === "BATCH") {
      document
        .getElementById("batches")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    handleEnroll();
  };

  const primaryLabel = existingEnrollment
    ? "Go to Dashboard"
    : !user
      ? "Login to Enroll"
      : course?.courseType === "BATCH"
        ? "Select Batch Below"
        : "Enroll Now";

  if (courseQuery.isLoading) {
    return <CourseDetailSkeleton />;
  }

  if (!course) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <span className="inline-flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <GraduationCap className="size-8" />
        </span>
        <h1 className="mt-6 text-2xl font-bold">Course not found</h1>
        <p className="mt-2 text-muted-foreground">
          The course you&apos;re looking for doesn&apos;t exist or was removed.
        </p>
        <Button className="mt-6" nativeButton={false} render={<Link href="/courses" />}>
          Browse all courses
        </Button>
      </div>
    );
  }

  const batches = course.batches ?? [];
  const reviews = reviewQuery.data?.reviews ?? [];
  const breakdown =
    statsQuery.data?.starBreakdown ?? reviewQuery.data?.starBreakdown;

  return (
    <div className="pb-20">
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        {/* BREADCRUMB */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="size-3.5" />
          <Link href="/courses" className="hover:text-foreground">
            Courses
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="truncate font-medium text-foreground">
            {course.title}
          </span>
        </nav>

        {/* HERO */}
        <div className="mt-6 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  LEVEL_BADGE_CLASS[course.level]
                )}
              >
                {course.level}
              </span>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {course.courseType === "FIXED" ? "Self-Paced" : "Live Batch"}
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              {course.title}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {course.description}
            </p>

            {course.admin && (
              <div className="mt-6 flex items-center gap-3">
                <Avatar size="lg">
                  {course.admin.avatar ? (
                    <AvatarImage
                      src={course.admin.avatar}
                      alt={course.admin.name}
                    />
                  ) : null}
                  <AvatarFallback>
                    {initials(course.admin.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{course.admin.name}</p>
                  <p className="text-sm text-muted-foreground">Instructor</p>
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Users className="size-4" />
                <span className="font-semibold text-foreground">{students}</span>
                students
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <BookOpen className="size-4" />
                <span className="font-semibold text-foreground">
                  {modulesCount}
                </span>
                modules
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <PlayCircle className="size-4" />
                <span className="font-semibold text-foreground">
                  {lessonsCount}
                </span>
                lessons
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Stars value={rating} />
                <span className="font-semibold text-foreground">
                  {rating.toFixed(1)}
                </span>
                <span>({reviewsCount} reviews)</span>
              </span>
            </div>
          </div>

          {/* PRICE CARD */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                <CourseThumbnail
                  src={course.thumbnail}
                  alt={course.title}
                  courseType={course.courseType}
                />
                <div className="space-y-5 p-6">
                  <div className="flex items-baseline gap-2">
                    <span
                      className={cn(
                        "text-3xl font-bold",
                        course.price === 0 ? "text-green-600" : "text-foreground"
                      )}
                    >
                      {formatPrice(course.price)}
                    </span>
                  </div>

                  {isAdmin ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                      <p className="mb-2 text-sm font-medium text-amber-800">
                        👨‍💼 You are logged in as Admin
                      </p>
                      <p className="mb-3 text-xs text-amber-700">
                        Only learner accounts can enroll in courses. To test
                        enrollment, please log out and register a new learner
                        account.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        nativeButton={false}
                        render={<Link href="/admin/dashboard" />}
                      >
                        Go to Admin Dashboard
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={handlePrimaryAction}
                      disabled={enrollMutation.isPending}
                    >
                      {enrollMutation.isPending && (
                        <Loader2 className="animate-spin" />
                      )}
                      {primaryLabel}
                    </Button>
                  )}

                  <ul className="space-y-2.5 text-sm">
                    <IncludedItem>Full lifetime access</IncludedItem>
                    <IncludedItem>Certificate of completion</IncludedItem>
                    <IncludedItem>{lessonsCount} lessons</IncludedItem>
                    <IncludedItem>{modulesCount} modules</IncludedItem>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BATCHES */}
        {course.courseType === "BATCH" && (
          <section id="batches" className="mt-16 scroll-mt-24">
            <h2 className="flex items-center gap-2 text-2xl font-bold">
              <CalendarDays className="size-6 text-primary" />
              Available Batches
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick a cohort that fits your schedule.
            </p>

            {batches.length === 0 ? (
              <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-muted/30 p-12 text-center">
                <span className="inline-flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CalendarDays className="size-7" />
                </span>
                <div>
                  <h3 className="font-semibold">No batches scheduled</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    New batches will be announced soon
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {batches.map((batch) => (
                  <BatchDetailCard
                    key={batch.id}
                    batchNumber={batch.batchNumber}
                    title={batch.title}
                    startDate={batch.startDate}
                    endDate={batch.endDate}
                    status={batch.status}
                    admin={isAdmin}
                    pending={enrollMutation.isPending}
                    disabled={Boolean(existingEnrollment)}
                    onEnroll={() => handleEnroll(batch.id)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* TABS */}
        <Tabs defaultValue="overview" className="mt-16">
          <TabsList className="w-full justify-start sm:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
            <TabsTrigger value="reviews">
              Reviews{reviewsCount > 0 ? ` (${reviewsCount})` : ""}
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="mt-8">
            <div className="max-w-3xl space-y-8">
              <div>
                <h2 className="text-xl font-bold">About this course</h2>
                <p className="mt-3 leading-relaxed whitespace-pre-line text-muted-foreground">
                  {course.description}
                </p>
              </div>

              {modules.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold">What you&apos;ll learn</h2>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                    {modules.map((module) => (
                      <li
                        key={module.id}
                        className="flex items-start gap-2 text-sm"
                      >
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                        <span>{module.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h2 className="text-xl font-bold">Requirements</h2>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                    No prior experience required
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                    A device with internet access
                  </li>
                </ul>
              </div>
            </div>
          </TabsContent>

          {/* CURRICULUM */}
          <TabsContent value="curriculum" className="mt-8">
            {modules.length === 0 ? (
              <EmptyBlock
                icon={<BookOpen className="size-7" />}
                title="Curriculum coming soon"
                subtitle="Lessons for this course will be published shortly."
              />
            ) : (
              <CurriculumAccordion modules={modules} />
            )}
          </TabsContent>

          {/* REVIEWS */}
          <TabsContent value="reviews" className="mt-8">
            {reviews.length === 0 ? (
              <EmptyBlock
                icon={<Star className="size-7" />}
                title="No reviews yet"
                subtitle="Be the first to share your experience."
              />
            ) : (
              <div className="grid gap-8 lg:grid-cols-3">
                <div className="rounded-2xl border bg-card p-6 text-center">
                  <p className="text-5xl font-bold">{rating.toFixed(1)}</p>
                  <div className="mt-2 flex justify-center">
                    <Stars value={rating} size="size-5" />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {reviewsCount} review{reviewsCount === 1 ? "" : "s"}
                  </p>
                  <div className="mt-6 space-y-2">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count =
                        breakdown?.[star as 1 | 2 | 3 | 4 | 5] ?? 0;
                      const pct =
                        reviewsCount > 0 ? (count / reviewsCount) * 100 : 0;
                      return (
                        <div
                          key={star}
                          className="flex items-center gap-2 text-sm"
                        >
                          <span className="w-3 text-muted-foreground">
                            {star}
                          </span>
                          <Star className="size-3.5 fill-amber-400 text-amber-400" />
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-amber-400"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-6 text-right text-muted-foreground">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4 lg:col-span-2">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="rounded-2xl border bg-card p-5"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          {review.learner?.avatar ? (
                            <AvatarImage
                              src={review.learner.avatar}
                              alt={review.learner?.name ?? "Learner"}
                            />
                          ) : null}
                          <AvatarFallback>
                            {initials(review.learner?.name ?? "?")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">
                            {review.learner?.name ?? "Anonymous"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(review.createdAt)}
                          </p>
                        </div>
                        <Stars value={review.rating} />
                      </div>
                      {review.comment && (
                        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function IncludedItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 text-muted-foreground">
      <CheckCircle2 className="size-4 shrink-0 text-green-500" />
      {children}
    </li>
  );
}

function EmptyBlock({
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

function CurriculumAccordion({ modules }: { modules: Module[] }) {
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current && modules.length > 0) {
      setOpenModules(new Set([modules[0].id]));
      initialized.current = true;
    }
  }, [modules]);

  const toggle = (id: string) =>
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="space-y-3">
      {modules.map((module, index) => {
        const open = openModules.has(module.id);
        const lessons = module.lessons ?? [];
        return (
          <div
            key={module.id}
            className="overflow-hidden rounded-xl border bg-card"
          >
            <button
              type="button"
              onClick={() => toggle(module.id)}
              className="flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium">{module.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {lessons.length} lesson{lessons.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <ChevronRight
                className={cn(
                  "size-5 shrink-0 text-muted-foreground transition-transform",
                  open && "rotate-90"
                )}
              />
            </button>

            {open && (
              <div className="border-t">
                {module.intro && (
                  <p className="px-4 py-3 text-sm text-muted-foreground">
                    {module.intro}
                  </p>
                )}
                {lessons.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-muted-foreground">
                    No lessons yet.
                  </p>
                ) : (
                  <ul className="divide-y">
                    {lessons.map((lesson) => (
                      <li
                        key={lesson.id}
                        className="flex items-center justify-between gap-3 px-4 py-3"
                      >
                        <span className="inline-flex items-center gap-2 text-sm">
                          <LessonTypeIcon type={lesson.type} />
                          {lesson.title}
                        </span>
                        <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                          {lesson.isFree && (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 font-semibold text-green-700">
                              Free Preview
                            </span>
                          )}
                          {lesson.type === "VIDEO" && lesson.duration ? (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="size-3.5" />
                              {Math.round(lesson.duration)} min
                            </span>
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function BatchDetailCard({
  batchNumber,
  title,
  startDate,
  endDate,
  status,
  admin,
  pending,
  disabled,
  onEnroll,
}: {
  batchNumber: number;
  title: string | null;
  startDate?: string;
  endDate?: string;
  status?: "UPCOMING" | "ACTIVE" | "COMPLETED";
  admin: boolean;
  pending: boolean;
  disabled: boolean;
  onEnroll: () => void;
}) {
  const badge =
    status === "ACTIVE"
      ? { label: "🔥 ACTIVE", className: "bg-green-100 text-green-700" }
      : status === "UPCOMING"
        ? { label: "⏰ UPCOMING", className: "bg-amber-100 text-amber-700" }
        : { label: "✓ COMPLETED", className: "bg-gray-200 text-gray-600" };

  return (
    <div className="flex flex-col rounded-2xl border bg-card p-5 transition-shadow hover:shadow-md">
      <span
        className={cn(
          "w-fit rounded-full px-2.5 py-0.5 text-xs font-bold",
          badge.className
        )}
      >
        {badge.label}
      </span>
      <p className="mt-3 font-semibold">
        Batch {batchNumber}
        {title ? ` · ${title}` : ""}
      </p>
      <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <CalendarDays className="size-4" />
        {formatDate(startDate)} – {formatDate(endDate)}
      </p>

      <div className="mt-5">
        {admin ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
            Admins cannot enroll. Log in with a learner account to join this
            batch.
          </div>
        ) : status === "ACTIVE" ? (
          <Button className="w-full" onClick={onEnroll} disabled={disabled || pending}>
            {pending && <Loader2 className="animate-spin" />}
            {disabled ? "Enrolled" : "Enroll Now"}
          </Button>
        ) : status === "UPCOMING" ? (
          <Button
            variant="outline"
            className="w-full"
            disabled
            title="Coming soon"
          >
            <Bell />
            Notify Me
          </Button>
        ) : (
          <Button variant="ghost" className="w-full" disabled>
            View Only
          </Button>
        )}
      </div>
    </div>
  );
}

function CourseDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="h-7 w-32 animate-pulse rounded-full bg-muted" />
          <div className="h-10 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-5 w-full animate-pulse rounded bg-muted" />
          <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-12 w-56 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="lg:col-span-1">
          <div className="overflow-hidden rounded-2xl border bg-card">
            <div className="aspect-video w-full animate-pulse bg-muted" />
            <div className="space-y-4 p-6">
              <div className="h-9 w-28 animate-pulse rounded bg-muted" />
              <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

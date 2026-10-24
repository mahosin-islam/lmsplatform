"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow, isToday, isTomorrow } from "date-fns";
import { toast } from "sonner";
import {
  ArrowRight,
  Award,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  GraduationCap,
  Loader2,
  Megaphone,
  PlayCircle,
  RefreshCw,
  Video,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type {
  AssignmentSubmission,
  LearnerDashboardData,
  LiveSession,
  MyAssignmentsData,
  MyLiveSessionsData,
  Notification,
  NotificationListData,
  NotificationType,
} from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const NOTIFICATION_META: Record<
  NotificationType,
  { icon: LucideIcon; bg: string }
> = {
  NEW_LESSON: { icon: BookOpen, bg: "bg-blue-500" },
  NEW_ASSIGNMENT: { icon: ClipboardList, bg: "bg-brand-teal/50" },
  NEW_LIVE_CLASS: { icon: Video, bg: "bg-red-500" },
  ANNOUNCEMENT: { icon: Megaphone, bg: "bg-amber-500" },
  COURSE_COMPLETED: { icon: GraduationCap, bg: "bg-emerald-500" },
};

function isLiveNow(session: LiveSession, now: number): boolean {
  const start = new Date(session.scheduledAt).getTime();
  const end = start + (session.duration || 60) * 60 * 1000;
  return now >= start && now < end;
}

function StatCard({
  icon: Icon,
  value,
  label,
  sub,
  href,
  iconBg,
}: {
  icon: LucideIcon;
  value: number;
  label: string;
  sub: string;
  href?: string;
  iconBg: string;
}) {
  const content = (
    <Card
      className={cn(
        "h-full",
        href ? "transition-shadow hover:shadow-md" : undefined
      )}
    >
      <CardContent className="flex items-start justify-between p-4">
        <div>
          <p className="text-3xl font-bold">{value}</p>
          <p className="mt-1 text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{sub}</p>
        </div>
        <span
          className={cn(
            "inline-flex size-10 shrink-0 items-center justify-center rounded-xl text-white",
            iconBg
          )}
        >
          <Icon className="size-5" />
        </span>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }
  return content;
}

function SectionHeader({
  title,
  linkHref,
  linkLabel,
  action,
}: {
  title: string;
  linkHref?: string;
  linkLabel?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <div className="flex items-center gap-2">
        {action}
        {linkHref && linkLabel ? (
          <Link
            href={linkHref}
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            <ArrowRight className="size-4" />
            {linkLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export default function LearnerDashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const learnerId = user?.id ?? "";

  const dashboardQuery = useQuery({
    queryKey: ["learner-dashboard", learnerId],
    enabled: Boolean(learnerId),
    queryFn: async () =>
      (
        await apiFetch<LearnerDashboardData>(
          `/dashboard/learner/${learnerId}`
        )
      ).data,
  });

  const liveQuery = useQuery({
    queryKey: ["live-sessions", "my", learnerId],
    enabled: Boolean(learnerId),
    queryFn: async () =>
      (await apiFetch<MyLiveSessionsData>(`/live-sessions/my/${learnerId}`))
        .data,
  });

  const assignmentsQuery = useQuery({
    queryKey: ["assignments", "my", learnerId],
    enabled: Boolean(learnerId),
    queryFn: async () =>
      (
        await apiFetch<MyAssignmentsData>(`/assignments/my/${learnerId}`)
      ).data,
  });

  const notificationsQuery = useQuery({
    queryKey: ["notifications", "my", learnerId],
    enabled: Boolean(learnerId),
    queryFn: async () =>
      (
        await apiFetch<NotificationListData>(
          `/notifications/my/${learnerId}?unreadOnly=true`
        )
      ).data,
  });

  const markAllRead = useMutation({
    mutationFn: async () =>
      apiFetch(`/notifications/read-all/${learnerId}`, { method: "PATCH" }),
    onSuccess: () => {
      toast.success("All notifications marked as read");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not update notifications"
      );
    },
  });

  if (dashboardQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-28 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-56 w-full rounded-xl" />
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-44 w-full rounded-xl" />
      </div>
    );
  }

  const dashboard = dashboardQuery.data;

  if (dashboardQuery.isError || !dashboard) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center">
        <p className="font-medium">Couldn&apos;t load your dashboard</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {dashboardQuery.error instanceof Error
            ? dashboardQuery.error.message
            : "Please try again."}
        </p>
        <Button className="mt-4" onClick={() => dashboardQuery.refetch()}>
          <RefreshCw className="size-4" />
          Try again
        </Button>
      </div>
    );
  }

  const stats = dashboard.enrollments;
  const recentEnrollments = dashboard.recentEnrollments;
  const upcomingLive = (liveQuery.data?.upcoming ?? []).slice(0, 2);
  const recentSubmissions = (assignmentsQuery.data?.submissions ?? []).slice(0, 3);
  const recentNotifications = (notificationsQuery.data?.notifications ?? []).slice(0, 3);
  const now = Date.now();

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 right-24 size-40 rounded-full bg-white/10 blur-2xl" />
        <p className="relative text-2xl font-bold tracking-tight">
          Hi, {(user?.name ?? "there").split(" ")[0]}! 👋
        </p>
        <p className="relative mt-1 text-sm text-white/85">
          Ready to continue learning?
        </p>
        <div className="relative mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2 text-xs text-white/85">
            <Calendar className="size-4" />
            Today is {format(new Date(), "EEEE, MMMM d, yyyy")}
          </span>
          <Button
            variant="secondary"
            nativeButton={false}
            render={<Link href="/learner/courses" />}
            className="bg-white text-primary hover:bg-primary/10"
          >
            Browse Courses
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={BookOpen}
          value={stats.total}
          label="Enrolled"
          sub={`${stats.active} active`}
          href="/learner/courses"
          iconBg="bg-primary/100"
        />
        <StatCard
          icon={PlayCircle}
          value={stats.active}
          label="Active"
          sub={`${stats.completed} completed`}
          href="/learner/courses"
          iconBg="bg-emerald-500"
        />
        <StatCard
          icon={Award}
          value={dashboard.certificates}
          label="Certificates"
          sub="earned"
          iconBg="bg-amber-500"
        />
        <StatCard
          icon={Bell}
          value={dashboard.notifications.unread}
          label="Unread"
          sub="notifications"
          href="/learner/notifications"
          iconBg="bg-rose-500"
        />
      </div>

      {recentEnrollments.length > 0 ? (
        <section className="space-y-4">
          <SectionHeader
            title="Continue Learning"
            linkHref="/learner/courses"
            linkLabel="View All"
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentEnrollments.slice(0, 3).map((enroll) => (
              <Card key={enroll.id} className="overflow-hidden">
                <div className="relative aspect-video w-full bg-primary/10">
                  {enroll.course.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={enroll.course.thumbnail}
                      alt={enroll.course.title}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <BookOpen className="size-8 text-primary/40" />
                    </div>
                  )}
                  {enroll.batch ? (
                    <Badge className="absolute left-2 top-2 bg-white/90 text-primary">
                      Batch {enroll.batch.batchNumber}
                    </Badge>
                  ) : null}
                </div>
                <CardContent className="space-y-3 p-4">
                  <p className="line-clamp-1 font-semibold">
                    {enroll.course.title}
                  </p>
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {enroll.status === "COMPLETED"
                          ? "Completed"
                          : enroll.status === "ACTIVE"
                            ? "In progress"
                            : "Pending"}
                      </span>
                      <span className="font-medium">{enroll.progress}%</span>
                    </div>
                    <Progress value={enroll.progress} className="mt-1.5 h-2" />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
nativeButton={false}
            render={<Link href="/learner/courses" />}
                  >
                    Continue
                    <ArrowRight className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-dashed p-10 text-center">
          <BookOpen className="mx-auto size-10 text-primary/40" />
          <p className="mt-3 font-medium">Start your learning journey</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Enroll in a course to see your lessons here.
          </p>
          <Button className="mt-4" nativeButton={false} render={<Link href="/learner/courses" />}>
            Browse Courses
            <ArrowRight className="size-4" />
          </Button>
        </section>
      )}

      {upcomingLive.length > 0 ? (
        <>
          <Separator />
          <section className="space-y-4">
            <SectionHeader
              title="Upcoming Live Classes"
              linkHref="/learner/live-sessions"
              linkLabel="View All"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {upcomingLive.map((session) => {
                const start = new Date(session.scheduledAt);
                const live = isLiveNow(session, now);
                const dayLabel = isToday(start)
                  ? "Today"
                  : isTomorrow(start)
                    ? "Tomorrow"
                    : format(start, "EEE, MMM d");
                return (
                  <div
                    key={session.id}
                    className={cn(
                      "rounded-xl border bg-card p-4",
                      live ? "border-red-200 bg-red-50/40 dark:bg-red-500/10" : undefined
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {live ? (
                        <Badge className="flex items-center gap-1 bg-red-500 text-white">
                          <span className="relative flex size-1.5">
                            <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
                            <span className="relative inline-flex size-1.5 rounded-full bg-white" />
                          </span>
                          Live Now
                        </Badge>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                          <Clock className="size-3.5" />
                          {dayLabel} · {format(start, "h:mm a")}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 font-semibold">{session.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {live
                        ? "The class is happening now — join in!"
                        : `Starts in ${formatDistanceToNow(start)}`}
                    </p>
                    {live ? (
                      <a href={session.meetingLink} target="_blank" rel="noreferrer">
                        <Button className="mt-3 w-full">
                          <Video className="size-4" />
                          Join Meeting
                        </Button>
                      </a>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 w-full"
                        nativeButton={false}
                        render={<Link href="/learner/live-sessions" />}
                      >
                        <PlayCircle className="size-4" />
                        Remind me
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </>
      ) : null}

      {recentSubmissions.length > 0 ? (
        <>
          <Separator />
          <section className="space-y-4">
            <SectionHeader
              title="Recent Submissions"
              linkHref="/learner/assignments"
              linkLabel="View All"
            />
            <div className="space-y-2">
              {recentSubmissions.map((submission: AssignmentSubmission) => {
                const assignment = submission.assignment;
                return (
                  <div
                    key={submission.id}
                    className="flex items-center gap-3 rounded-xl border bg-card p-3"
                  >
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-teal/10 text-brand-teal-strong">
                      <ClipboardList className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {assignment?.title ?? "Assignment"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {assignment?.module?.title ?? ""}
                        {assignment?.module?.title ? " · " : ""}
                        {formatDistanceToNow(new Date(submission.submittedAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      {submission.status === "GRADED" ? (
                        <>
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                            Graded
                          </Badge>
                          <p className="mt-1 text-xs font-medium text-muted-foreground">
                            {submission.marks}/{assignment?.totalMarks}
                          </p>
                        </>
                      ) : (
                        <Badge variant="secondary">Submitted</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      ) : null}

      {recentNotifications.length > 0 ? (
        <>
          <Separator />
          <section className="space-y-4">
            <SectionHeader
              title="Recent Notifications"
              linkHref="/learner/notifications"
              linkLabel="View All"
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                >
                  {markAllRead.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )}
                  Mark all as read
                </Button>
              }
            />
            <div className="space-y-2">
              {recentNotifications.map((notification: Notification) => {
                const meta = NOTIFICATION_META[notification.type];
                const Icon = meta?.icon ?? Bell;
                return (
                  <div
                    key={notification.id}
                    className="flex items-start gap-3 rounded-xl border bg-card p-3"
                  >
                    <span
                      className={cn(
                        "mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full text-white",
                        meta?.bg ?? "bg-background0"
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {notification.title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {notification.message}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                      <span className="size-2 rounded-full bg-primary/100" />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
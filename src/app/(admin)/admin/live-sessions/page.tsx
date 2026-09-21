"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  CalendarDays,
  Clock3,
  Link as LinkIcon,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Video,
} from "lucide-react";

import { apiFetch } from "@/lib/api";
import type {
  BatchListData,
  CourseListData,
  LiveSession,
  LiveSessionListData,
} from "@/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LiveSessionFormDialog } from "@/components/admin/LiveSessionFormDialog";

type SessionStatus = "LIVE" | "UPCOMING" | "ENDED";

type CombinedSession = LiveSession & {
  courseId: string;
  courseTitle: string;
  batchTitle: string;
  batchNumber: number;
};

function computeStatus(session: CombinedSession, now: number): SessionStatus {
  const start = new Date(session.scheduledAt).getTime();
  const end = start + (session.duration || 60) * 60 * 1000;
  if (now >= start && now < end) return "LIVE";
  if (now < start) return "UPCOMING";
  return "ENDED";
}

function startIn(iso: string): string {
  const mins = Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 60000));
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  const minutes = mins % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

const STATUS_META: Record<
  SessionStatus,
  { label: string; strip: string; badge: string; pulse?: boolean }
> = {
  LIVE: {
    label: "Live Now",
    strip: "bg-emerald-500",
    badge: "bg-emerald-500 text-white",
    pulse: true,
  },
  UPCOMING: {
    label: "Upcoming",
    strip: "bg-amber-400",
    badge: "bg-amber-100 text-amber-700",
  },
  ENDED: {
    label: "Ended",
    strip: "bg-gray-300",
    badge: "bg-gray-100 text-gray-500",
  },
};

export default function LiveSessionsPage() {
  const queryClient = useQueryClient();
  const [courseFilter, setCourseFilter] = useState("all");
  const [batchFilter, setBatchFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | SessionStatus>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editSession, setEditSession] = useState<CombinedSession | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CombinedSession | null>(null);

  const sessionsQuery = useQuery({
    queryKey: ["live-sessions", "all"],
    queryFn: async (): Promise<CombinedSession[]> => {
      const coursesRes = await apiFetch<CourseListData>("/courses?courseType=BATCH");
      const courses = coursesRes.data?.courses ?? [];

      const batchGroups = await Promise.all(
        courses.map(async (course) => ({
          courseId: course.id,
          courseTitle: course.title,
          batches:
            (
              await apiFetch<BatchListData>(`/batches/course/${course.id}`)
            ).data?.batches ?? [],
        }))
      );

      const batches = batchGroups.flatMap((group) =>
        group.batches.map((batch) => ({
          id: batch.id,
          batchNumber: batch.batchNumber,
          batchTitle: batch.title ?? `Batch ${batch.batchNumber}`,
          courseId: group.courseId,
          courseTitle: group.courseTitle,
        }))
      );

      const sessionGroups = await Promise.all(
        batches.map(async (batch) => ({
          batch,
          sessions:
            (
              await apiFetch<LiveSessionListData>(
                `/live-sessions/batch/${batch.id}`
              )
            ).data?.sessions ?? [],
        }))
      );

      const combined = sessionGroups.flatMap(({ batch, sessions }) =>
        sessions.map((session) => ({
          ...session,
          courseId: batch.courseId,
          courseTitle: batch.courseTitle,
          batchTitle: batch.batchTitle,
          batchNumber: batch.batchNumber,
        }))
      );

      combined.sort(
        (a, b) =>
          new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
      );

      return combined;
    },
    staleTime: 30_000,
  });

  const sessions = useMemo(
    () => sessionsQuery.data ?? [],
    [sessionsQuery.data]
  );

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["live-sessions"] });
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) =>
      apiFetch(`/live-sessions/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Live class deleted");
      setDeleteTarget(null);
      invalidateAll();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not delete live class"
      );
    },
  });

  const courses = useMemo(() => {
    const map = new Map<string, string>();
    sessions.forEach((session) => map.set(session.courseId, session.courseTitle));
    return Array.from(map, ([id, title]) => ({ id, title }));
  }, [sessions]);

  const batches = useMemo(() => {
    const map = new Map<string, string>();
    sessions
      .filter((session) => courseFilter === "all" || session.courseId === courseFilter)
      .forEach((session) => map.set(session.batchId, session.batchTitle));
    return Array.from(map, ([id, label]) => ({ id, label }));
  }, [sessions, courseFilter]);

  useEffect(() => {
    if (batchFilter !== "all" && !batches.some((batch) => batch.id === batchFilter)) {
      setBatchFilter("all");
    }
  }, [batches, batchFilter]);

  const filtered = sessions.filter(
    (session) =>
      (courseFilter === "all" || session.courseId === courseFilter) &&
      (batchFilter === "all" || session.batchId === batchFilter) &&
      (statusFilter === "all" || computeStatus(session, Date.now()) === statusFilter)
  );

  const liveCount = sessions.filter(
    (session) => computeStatus(session, Date.now()) === "LIVE"
  ).length;
  const upcomingCount = sessions.filter(
    (session) => computeStatus(session, Date.now()) === "UPCOMING"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Live Sessions</h1>
          <p className="text-sm text-muted-foreground">
            Host real-time classes for batches and students.
          </p>
        </div>
        <Button onClick={() => { setEditSession(null); setFormOpen(true); }}>
          <Plus className="size-4" />
          Schedule Live Class
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Sessions
            </CardTitle>
            <Video className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{sessions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Now</CardTitle>
            <Clock3 className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-600">{liveCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <CalendarDays className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">{upcomingCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-[repeat(auto-fit,minmax(160px,1fr))] lg:grid-cols-[240px_240px_1fr]">
        <Select
          value={courseFilter}
          onValueChange={(value) => {
            setCourseFilter(value ?? "all");
            setBatchFilter("all");
          }}
        >
          <SelectTrigger>
            <SelectValue>
              {(current: string) =>
                current === "all"
                  ? "All Courses"
                  : courses.find((course) => course.id === current)?.title ||
                    "All Courses"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={batchFilter}
          onValueChange={(value) => setBatchFilter(value ?? "all")}
        >
          <SelectTrigger>
            <SelectValue>
              {(current: string) =>
                current === "all"
                  ? "All Batches"
                  : batches.find((batch) => batch.id === current)?.label ||
                    "All Batches"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Batches</SelectItem>
            {batches.map((batch) => (
              <SelectItem key={batch.id} value={batch.id}>
                {batch.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Tabs
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as "all" | SessionStatus)}
          className="sm:col-span-2 lg:col-span-1"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="LIVE">Live</TabsTrigger>
            <TabsTrigger value="UPCOMING">Upcoming</TabsTrigger>
            <TabsTrigger value="ENDED">Ended</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {sessionsQuery.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <Video className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-4 font-medium">No live sessions yet</p>
          <p className="text-sm text-muted-foreground">
            Schedule your first live class to get started.
          </p>
          <Button className="mt-4" onClick={() => { setEditSession(null); setFormOpen(true); }}>
            <Plus className="size-4" />
            Schedule Live Class
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          No sessions match the selected filters.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((session) => {
            const status = computeStatus(session, Date.now());
            const meta = STATUS_META[status];
            const startDate = new Date(session.scheduledAt);
            return (
              <div
                key={session.id}
                className="flex overflow-hidden rounded-xl border bg-card"
              >
                <div className={`w-1.5 shrink-0 ${meta.strip}`} />
                <div className="flex flex-1 flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold">{session.title}</p>
                      {meta.pulse ? (
                        <Badge className={meta.badge}>
                          <span className="relative flex size-1.5">
                            <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
                            <span className="relative inline-flex size-1.5 rounded-full bg-white" />
                          </span>
                          {meta.label}
                        </Badge>
                      ) : (
                        <Badge className={meta.badge}>{meta.label}</Badge>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="truncate">{session.courseTitle}</span>
                      <span className="truncate">{session.batchTitle}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="size-3.5" />
                        {format(startDate, "EEE, MMM d")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock3 className="size-3.5" />
                        {format(startDate, "h:mm a")}
                        {" · "}
                        {session.duration > 60
                          ? `${Math.floor(session.duration / 60)}h ${session.duration % 60}m`
                          : `${session.duration}m`}
                      </span>
                      {status === "UPCOMING" ? (
                        <span className="font-medium text-amber-600">
                          Starting in {startIn(session.scheduledAt)}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {status === "LIVE" ? (
                    <a
                      href={session.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button className="w-full sm:w-auto">
                        <LinkIcon className="size-4" />
                        Join Meeting
                      </Button>
                    </a>
                  ) : null}

                  <div className="flex items-center gap-2 sm:shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => { setEditSession(session); setFormOpen(true); }}
                      title="Edit live class"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(session)}
                      title="Delete live class"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <LiveSessionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        existing={editSession}
        onSuccess={invalidateAll}
      />

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete live class?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove &quot;{deleteTarget?.title}&quot;. Students
              will no longer see it in their schedule.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
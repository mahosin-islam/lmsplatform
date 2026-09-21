"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bell,
  CheckCheck,
  Inbox,
  Info,
  Loader2,
  Megaphone,
  RefreshCw,
  Send,
  Trash2,
  Users,
} from "lucide-react";
import { cn } from "cn";

import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { timeAgo } from "@/lib/course-utils";
import { useLearnerList } from "@/hooks/use-learner-list";
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_TYPE_META,
  NotificationPreview,
} from "@/components/admin/NotificationPreview";
import type {
  BatchListData,
  CourseListData,
  NotificationListData,
  NotificationType,
} from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface SubmitInput {
  kind: "specific" | "batch";
  userId?: string;
  batchId?: string;
  courseId?: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

function MessageFields({
  type,
  onTypeChange,
  title,
  onTitleChange,
  message,
  onMessageChange,
  link,
  onLinkChange,
}: {
  type: NotificationType;
  onTypeChange: (value: NotificationType) => void;
  title: string;
  onTitleChange: (value: string) => void;
  message: string;
  onMessageChange: (value: string) => void;
  link: string;
  onLinkChange: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="notification-type">Type</Label>
        <Select
          value={type}
          onValueChange={(value) => onTypeChange(value as NotificationType)}
        >
          <SelectTrigger id="notification-type" className="w-full">
            <SelectValue>
              {(value: NotificationType) => NOTIFICATION_TYPE_META[value].label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {NOTIFICATION_TYPES.map((item) => (
              <SelectItem key={item} value={item}>
                {NOTIFICATION_TYPE_META[item].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notification-title">Title</Label>
        <Input
          id="notification-title"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="e.g. New lesson is live"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="notification-message">Message</Label>
          <span className="text-xs text-muted-foreground">
            {message.length}/500
          </span>
        </div>
        <Textarea
          id="notification-message"
          rows={4}
          maxLength={500}
          value={message}
          onChange={(event) => onMessageChange(event.target.value)}
          placeholder="Write the message students will see..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notification-link">Link (optional)</Label>
        <Input
          id="notification-link"
          value={link}
          onChange={(event) => onLinkChange(event.target.value)}
          placeholder="https://..."
          type="url"
        />
      </div>
    </div>
  );
}

function BatchPicker({
  courseId,
  value,
  onChange,
}: {
  courseId: string;
  value: string;
  onChange: (batchId: string) => void;
}) {
  const batchesQuery = useQuery({
    queryKey: ["batches", "all", courseId],
    enabled: Boolean(courseId),
    queryFn: async () =>
      (await apiFetch<BatchListData>(`/batches/course/${courseId}`)).data,
  });

  const batches = batchesQuery.data?.batches ?? [];

  if (!courseId) {
    return (
      <div className="rounded-lg border border-dashed p-3 text-center text-sm text-muted-foreground">
        Select a course first to choose its batches.
      </div>
    );
  }

  if (batchesQuery.isLoading) {
    return <Skeleton className="h-8 w-full" />;
  }

  if (batches.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-3 text-center text-sm text-muted-foreground">
        No batches found for this course.
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={(next) => onChange(next ?? "")}>
      <SelectTrigger id="batch-picker" className="w-full">
        <SelectValue>
          {(current: string) => {
            const batch = batches.find((item) => item.id === current);
            if (!batch) return "Select a batch";
            return batch.title ?? `Batch ${batch.batchNumber}`;
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {batches.map((batch) => (
          <SelectItem key={batch.id} value={batch.id}>
            {batch.title ?? `Batch ${batch.batchNumber}`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function AdminNotificationsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [tab, setTab] = React.useState("send");

  const [historyFilter, setHistoryFilter] = React.useState<"all" | "unread">(
    "all"
  );

  const adminId = user?.id;

  const learners = useLearnerList();

  const coursesQuery = useQuery({
    queryKey: ["courses"],
    queryFn: async () =>
      (await apiFetch<CourseListData>("/courses")).data,
  });

  const historyQuery = useQuery({
    queryKey: ["notifications", "mine", adminId ?? "none"],
    enabled: Boolean(adminId),
    queryFn: async () =>
      (await apiFetch<NotificationListData>(`/notifications/my/${adminId}`))
        .data,
  });

  // ── Send tab ──────────────────────────────────────────────
  const [sendScopeValue, setSendScopeValue] = React.useState<"specific" | "batch">(
    "specific"
  );
  const [sendLearnerId, setSendLearnerId] = React.useState("");
  const [sendCourseId, setSendCourseId] = React.useState("");
  const [sendBatchId, setSendBatchId] = React.useState("");
  const [sendType, setSendType] = React.useState<NotificationType>(
    "ANNOUNCEMENT"
  );
  const [sendTitle, setSendTitle] = React.useState("");
  const [sendMessage, setSendMessage] = React.useState("");
  const [sendLink, setSendLink] = React.useState("");

  const sendMutation = useMutation({
    mutationFn: async (input: SubmitInput) => {
      if (input.kind === "specific" && input.userId) {
        return apiFetch("/notifications/send", {
          method: "POST",
          body: {
            userId: input.userId,
            type: input.type,
            title: input.title,
            message: input.message,
            link: input.link,
          },
        });
      }
      return apiFetch("/notifications/broadcast", {
        method: "POST",
        body: {
          batchId: input.batchId,
          type: input.type,
          title: input.title,
          message: input.message,
          link: input.link,
        },
      });
    },
    onSuccess: (_data, input) => {
      if (input.kind === "specific") {
        toast.success("Notification sent to student");
      } else {
        toast.success("Notification sent to all students in the batch");
      }
      setSendLearnerId("");
      setSendCourseId("");
      setSendBatchId("");
      setSendTitle("");
      setSendMessage("");
      setSendLink("");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not send notification"
      );
    },
  });

  const submitSend = () => {
    if (!sendTitle.trim() || !sendMessage.trim()) {
      toast.error("Title and message are required");
      return;
    }
    if (sendScopeValue === "specific" && !sendLearnerId) {
      toast.error("Choose a recipient");
      return;
    }
    if (sendScopeValue === "batch" && !sendBatchId) {
      toast.error("Choose a batch to send to");
      return;
    }
    sendMutation.mutate({
      kind: sendScopeValue,
      userId: sendScopeValue === "specific" ? sendLearnerId : undefined,
      batchId: sendScopeValue === "batch" ? sendBatchId : undefined,
      type: sendType,
      title: sendTitle.trim(),
      message: sendMessage.trim(),
      link: sendLink.trim() || undefined,
    });
  };

  // ── Broadcast tab ─────────────────────────────────────────
  const [bTarget, setBTarget] = React.useState<"course" | "batch">("course");
  const [bCourseId, setBCourseId] = React.useState("");
  const [bBatchCourseId, setBBatchCourseId] = React.useState("");
  const [bBatchId, setBBatchId] = React.useState("");
  const [bType, setBType] = React.useState<NotificationType>("ANNOUNCEMENT");
  const [bTitle, setBTitle] = React.useState("");
  const [bMessage, setBMessage] = React.useState("");
  const [bLink, setBLink] = React.useState("");

  const batchesCourses = React.useMemo(
    () => (coursesQuery.data?.courses ?? []).filter((course) => course.courseType === "BATCH"),
    [coursesQuery.data]
  );

  const broadcastMutation = useMutation({
    mutationFn: async (input: SubmitInput) =>
      apiFetch("/notifications/broadcast", {
        method: "POST",
        body: {
          courseId: input.courseId,
          batchId: input.batchId,
          type: input.type,
          title: input.title,
          message: input.message,
          link: input.link,
        },
      }),
    onSuccess: (response) => {
      const sentCount = (response.data as { sentCount?: number } | null)
        ?.sentCount;
      toast.success(
        sentCount !== undefined
          ? `Broadcast sent to ${sentCount} students`
          : "Broadcast sent"
      );
      setBCourseId("");
      setBBatchCourseId("");
      setBBatchId("");
      setBTitle("");
      setBMessage("");
      setBLink("");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not broadcast"
      );
    },
  });

  const submitBroadcast = () => {
    const courseId = bTarget === "course" ? bCourseId : bBatchCourseId;
    if (!bTitle.trim() || !bMessage.trim()) {
      toast.error("Title and message are required");
      return;
    }
    if (bTarget === "course" && !courseId) {
      toast.error("Choose a course");
      return;
    }
    if (bTarget === "batch" && !bBatchId) {
      toast.error("Choose a batch");
      return;
    }
    broadcastMutation.mutate({
      kind: "batch",
      courseId: bTarget === "course" ? courseId : undefined,
      batchId: bTarget === "batch" ? bBatchId : undefined,
      type: bType,
      title: bTitle.trim(),
      message: bMessage.trim(),
      link: bLink.trim() || undefined,
    });
  };

  // ── History tab ───────────────────────────────────────────
  const markReadMutation = useMutation({
    mutationFn: async (id: string) =>
      apiFetch(`/notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "mine"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () =>
      apiFetch(`/notifications/read-all/${adminId}`, { method: "PATCH" }),
    onSuccess: () => {
      toast.success("All notifications marked as read");
      queryClient.invalidateQueries({ queryKey: ["notifications", "mine"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not update notifications"
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) =>
      apiFetch(`/notifications/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "mine"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not delete notification"
      );
    },
  });

  const clearReadMutation = useMutation({
    mutationFn: async () =>
      apiFetch(`/notifications/clear/${adminId}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Read notifications cleared");
      queryClient.invalidateQueries({ queryKey: ["notifications", "mine"] });
    },
  });

  const notifications = React.useMemo(
    () => historyQuery.data?.notifications ?? [],
    [historyQuery.data]
  );
  const unreadCount = historyQuery.data?.unreadCount ?? 0;
  const filteredNotifications = React.useMemo(
    () =>
      historyFilter === "unread"
        ? notifications.filter((notification) => !notification.isRead)
        : notifications,
    [notifications, historyFilter]
  );

  const courseOptions = coursesQuery.data?.courses ?? [];
  const learnerOptions = learners.learners;

  const historyIsBusy =
    markAllReadMutation.isPending || clearReadMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Send messages to individual students or whole classes
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <Inbox className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xl font-bold tabular-nums">
                {notifications.length}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                Inbox (your notifications)
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <Bell className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xl font-bold tabular-nums">
                {unreadCount}
              </p>
              <p className="truncate text-xs text-muted-foreground">Unread</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <Users className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xl font-bold tabular-nums">
                {learnerOptions.length}
              </p>
              <p className="truncate text-xs text-muted-foreground">Learners</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="send">
            <Send className="size-4" />
            Send
          </TabsTrigger>
          <TabsTrigger value="broadcast">
            <Megaphone className="size-4" />
            Broadcast
          </TabsTrigger>
          <TabsTrigger value="history">
            <Bell className="size-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-4">
          <Card>
            <CardContent className="space-y-4 p-4">
              <div className="space-y-2">
                <Label>Recipient</Label>
                <RadioGroup
                  value={sendScopeValue}
                  onValueChange={(value) =>
                    setSendScopeValue(value as "specific" | "batch")
                  }
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem
                      value="specific"
                      aria-label="Send to a specific student"
                    />
                    <span className="text-sm">Specific Student</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem
                      value="batch"
                      aria-label="Send to all students in a batch"
                    />
                    <span className="text-sm">All Students in a Batch</span>
                  </div>
                </RadioGroup>
              </div>

              {sendScopeValue === "specific" ? (
                <div className="space-y-2">
                  <Label htmlFor="send-recipient">Student</Label>
                  {learnerOptions.length === 0 ? (
                    <Skeleton className="h-8 w-full" />
                  ) : (
                    <Select
                      value={sendLearnerId}
                      onValueChange={(value) => setSendLearnerId(value ?? "")}
                    >
                      <SelectTrigger id="send-recipient" className="w-full">
                        <SelectValue>
                          {(current: string) =>
                            (learnerOptions.find(
                              (learner) => learner.id === current
                            )?.name ??
                              learnerOptions.find(
                                (learner) => learner.id === current
                              )?.email) ||
                            "Select a student"
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {learnerOptions.map((learner) => (
<SelectItem key={learner.id} value={learner.id}>
                            {learner.name}
                            {" · "}
                            {learner.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="send-course">Course</Label>
                    <Select
                      value={sendCourseId}
                      onValueChange={(value) => {
                        setSendCourseId(value ?? "");
                        setSendBatchId("");
                      }}
                    >
                      <SelectTrigger id="send-course" className="w-full">
                        <SelectValue>
                          {(current: string) =>
                            (courseOptions.find(
                              (course) => course.id === current
                            )?.title) || "Select a course"
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {batchesCourses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Batch</Label>
                    <BatchPicker
                      courseId={sendCourseId}
                      value={sendBatchId}
                      onChange={setSendBatchId}
                    />
                  </div>
                </div>
              )}

              <MessageFields
                type={sendType}
                onTypeChange={setSendType}
                title={sendTitle}
                onTitleChange={setSendTitle}
                message={sendMessage}
                onMessageChange={setSendMessage}
                link={sendLink}
                onLinkChange={setSendLink}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <NotificationPreview
                  type={sendType}
                  title={sendTitle}
                  message={sendMessage}
                  link={sendLink.trim() || null}
                />
                <div />
              </div>

              <Button
                onClick={submitSend}
                disabled={sendMutation.isPending}
                className="w-full sm:w-auto"
              >
                {sendMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Send Notification
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="broadcast" className="space-y-4">
          <Card>
            <CardContent className="space-y-4 p-4">
              <div className="space-y-2">
                <Label>Target</Label>
                <RadioGroup
                  value={bTarget}
                  onValueChange={(value) =>
                    setBTarget(value as "course" | "batch")
                  }
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem
                      value="course"
                      aria-label="Broadcast to all students in a course"
                    />
                    <span className="text-sm">All Students in a Course</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem
                      value="batch"
                      aria-label="Broadcast to all students in a batch"
                    />
                    <span className="text-sm">All Students in a Batch</span>
                  </div>
                </RadioGroup>
              </div>

              {bTarget === "course" ? (
                <div className="space-y-2">
                  <Label htmlFor="b-course">Course</Label>
                  <Select
                    value={bCourseId}
                    onValueChange={(value) => setBCourseId(value ?? "")}
                  >
                    <SelectTrigger id="b-course" className="w-full">
                      <SelectValue>
                        {(current: string) =>
                          (courseOptions.find(
                            (course) => course.id === current
                          )?.title) || "Select a course"
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {courseOptions.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="b-course">Course</Label>
                    <Select
                      value={bBatchCourseId}
                      onValueChange={(value) => {
                        setBBatchCourseId(value ?? "");
                        setBBatchId("");
                      }}
                    >
                      <SelectTrigger id="b-course" className="w-full">
                        <SelectValue>
                          {(current: string) =>
                            (batchesCourses.find(
                              (course) => course.id === current
                            )?.title) || "Select a course"
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {batchesCourses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Batch</Label>
                    <BatchPicker
                      courseId={bBatchCourseId}
                      value={bBatchId}
                      onChange={setBBatchId}
                    />
                  </div>
                </div>
              )}

              <MessageFields
                type={bType}
                onTypeChange={setBType}
                title={bTitle}
                onTitleChange={setBTitle}
                message={bMessage}
                onMessageChange={setBMessage}
                link={bLink}
                onLinkChange={setBLink}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <NotificationPreview
                  type={bType}
                  title={bTitle}
                  message={bMessage}
                  link={bLink.trim() || null}
                />
                <div />
              </div>

              <Button
                onClick={submitBroadcast}
                disabled={broadcastMutation.isPending}
                className="w-full sm:w-auto"
              >
                {broadcastMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Megaphone className="size-4" />
                )}
                Broadcast to Students
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant={historyFilter === "all" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setHistoryFilter("all")}
              >
                All
              </Button>
              <Button
                variant={historyFilter === "unread" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setHistoryFilter("unread")}
              >
                Unread {unreadCount > 0 ? `(${unreadCount})` : ""}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllReadMutation.mutate()}
                disabled={unreadCount === 0 || historyIsBusy}
              >
                <CheckCheck className="size-4" />
                Mark all read
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => clearReadMutation.mutate()}
                disabled={notifications.length === 0 || historyIsBusy}
              >
                {clearReadMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                Clear read
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => historyQuery.refetch()}
                disabled={historyQuery.isFetching}
                aria-label="Refresh history"
              >
                <RefreshCw
                  className={cn("size-4", historyQuery.isFetching && "animate-spin")}
                />
              </Button>
            </div>
          </div>

          {historyQuery.isError ? (
            <Card className="border-destructive/30">
              <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <span className="inline-flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <Info className="size-6" />
                </span>
                <div>
                  <p className="font-semibold">Could not load history</p>
                  <p className="text-sm text-muted-foreground">
                    {historyQuery.error instanceof Error
                      ? historyQuery.error.message
                      : "Something went wrong."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : historyQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Card key={index}>
                  <CardContent className="flex items-start gap-3 p-4">
                    <Skeleton className="size-9 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-2/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                  <Bell className="size-7" />
                </span>
                <div>
                  <p className="font-semibold">
                    {historyFilter === "unread"
                      ? "No unread notifications"
                      : "Nothing in your inbox yet"}
                  </p>
                  <p className="mx-auto max-w-md text-sm text-muted-foreground">
                    This History tab shows notifications addressed to you (the
                    admin). Notifications you send to learners do not appear
                    here.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => {
                const meta =
                  NOTIFICATION_TYPE_META[notification.type] ??
                  NOTIFICATION_TYPE_META.ANNOUNCEMENT;
                const Icon = meta.icon;
                const isUnread = !notification.isRead;
                return (
                  <Card key={notification.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <span
                          className={cn(
                            "inline-flex size-9 shrink-0 items-center justify-center rounded-lg",
                            meta.iconClass
                          )}
                        >
                          <Icon className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant="secondary"
                              className={meta.badgeClass}
                            >
                              {meta.label}
                            </Badge>
                            {isUnread ? (
                              <Badge className="bg-primary text-primary-foreground">
                                New
                              </Badge>
                            ) : null}
                            {notification.batch ? (
                              <span className="text-xs text-muted-foreground">
                                Batch {notification.batch.batchNumber}
                              </span>
                            ) : null}
                          </div>
                          <p
                            className={cn(
                              "mt-1.5 font-medium",
                              isUnread && "font-semibold"
                            )}
                          >
                            {notification.title}
                          </p>
                          <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                          {notification.link ? (
                            <a
                              href={notification.link}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-block max-w-full truncate text-xs text-primary hover:underline"
                            >
                              {notification.link}
                            </a>
                          ) : null}
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span title={notification.createdAt}>
                              {timeAgo(notification.createdAt)}
                            </span>
                            {isUnread ? (
                              <button
                                type="button"
                                className="font-medium text-primary hover:underline"
                                onClick={() =>
                                  markReadMutation.mutate(notification.id)
                                }
                              >
                                Mark as read
                              </button>
                            ) : null}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Delete notification"
                          onClick={() => deleteMutation.mutate(notification.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
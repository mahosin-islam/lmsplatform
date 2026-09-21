"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowRight,
  Bell,
  CheckCheck,
  Check,
  Loader2,
  Trash2,
} from "lucide-react";
import { cn } from "cn";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { NOTIFICATION_TYPE_META } from "@/components/admin/NotificationPreview";
import type { Notification, NotificationListData } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PLACEHOLDER = "\u2014";

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return PLACEHOLDER;
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "Just now";
  if (minutes < 60)
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function LearnerNotificationsPage() {
  const { user } = useAuth();
  const learnerId = user?.id;
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = React.useState<"all" | "unread">("all");
  const [clearDialogOpen, setClearDialogOpen] = React.useState(false);

  const notificationsQuery = useQuery({
    queryKey: ["notifications", "my", learnerId],
    enabled: Boolean(learnerId),
    refetchInterval: 30_000,
    queryFn: async () =>
      (await apiFetch<NotificationListData>(`/notifications/my/${learnerId}`))
        .data,
  });

  const notifications = React.useMemo(
    () => notificationsQuery.data?.notifications ?? [],
    [notificationsQuery.data]
  );
  const unreadCount = notificationsQuery.data?.unreadCount ?? 0;

  const invalidateAll = React.useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: ["notifications", "my", learnerId],
    });
    void queryClient.invalidateQueries({
      queryKey: ["unread-count", learnerId],
    });
  }, [queryClient, learnerId]);

  const markReadMutation = useMutation({
    mutationFn: async (id: string) =>
      apiFetch(`/notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: () => invalidateAll(),
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not update notification"
      );
    },
  });

  const markAllMutation = useMutation({
    mutationFn: async () =>
      apiFetch(`/notifications/read-all/${learnerId}`, { method: "PATCH" }),
    onSuccess: () => {
      toast.success("All notifications marked as read");
      invalidateAll();
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
      toast.success("Notification deleted");
      invalidateAll();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not delete notification"
      );
    },
  });

  const clearReadMutation = useMutation({
    mutationFn: async () =>
      apiFetch(`/notifications/clear/${learnerId}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Read notifications cleared");
      setClearDialogOpen(false);
      invalidateAll();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not clear notifications"
      );
    },
  });

  const filtered = React.useMemo(
    () =>
      activeTab === "unread"
        ? notifications.filter((notification) => !notification.isRead)
        : notifications,
    [notifications, activeTab]
  );

  const handleClick = (notification: Notification): void => {
    if (!notification.isRead) {
      markReadMutation.mutate(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const markAllPending = markAllMutation.isPending;
  const clearPending = clearReadMutation.isPending;
  const tabBusy = markAllPending || clearPending;

  const hasReadNotifications = notifications.some(
    (notification) => notification.isRead
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "You're all caught up"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllMutation.mutate()}
            disabled={unreadCount === 0 || tabBusy}
          >
            {markAllPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCheck className="size-4" />
            )}
            Mark All as Read
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setClearDialogOpen(true)}
            disabled={!hasReadNotifications || clearPending}
          >
            {clearPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            Clear Read
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto pb-1">
          <TabsList className="w-fit">
            <TabsTrigger value="all">
              All
              <span className="ml-1 rounded-full bg-muted-foreground/10 px-1.5 text-xs font-semibold tabular-nums">
                {notifications.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              <span className="ml-1 rounded-full bg-muted-foreground/10 px-1.5 text-xs font-semibold tabular-nums">
                {unreadCount}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      {notificationsQuery.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((index) => (
            <Card key={index}>
              <CardContent className="flex items-start gap-3 p-4">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : notificationsQuery.isError ? (
        <Card className="border-destructive/30">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Bell className="size-10 text-destructive/60" />
            <p className="mt-3 font-semibold">Couldn&apos;t load notifications</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {notificationsQuery.error instanceof Error
                ? notificationsQuery.error.message
                : "Something went wrong."}
            </p>
            <Button
              className="mt-4"
              onClick={() => notificationsQuery.refetch()}
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : notifications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Bell className="size-7" />
            </span>
            <p className="mt-4 font-semibold">No notifications</p>
            <p className="mt-1 text-sm text-muted-foreground">
              You&apos;ll see updates here when there&apos;s new activity.
            </p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCheck className="size-7" />
            </span>
            <p className="mt-4 font-semibold">All caught up!</p>
            <p className="mt-1 text-sm text-muted-foreground">
              You have no unread notifications.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((notification) => {
            const meta =
              NOTIFICATION_TYPE_META[notification.type] ??
              NOTIFICATION_TYPE_META.ANNOUNCEMENT;
            const Icon = meta.icon;
            const isUnread = !notification.isRead;
            return (
              <Card
                key={notification.id}
                className={cn(
                  "overflow-hidden transition-colors",
                  isUnread
                    ? "border-blue-200/60 bg-white hover:bg-slate-50"
                    : "bg-slate-50/50 hover:bg-slate-50"
                )}
              >
                <CardContent className="p-4">
                  <div
                    className="flex cursor-pointer items-start gap-3"
                    onClick={() => handleClick(notification)}
                  >
                    {isUnread ? (
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-blue-500" />
                    ) : (
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-transparent" />
                    )}
                    <span
                      className={cn(
                        "inline-flex size-10 shrink-0 items-center justify-center rounded-full",
                        meta.iconClass
                      )}
                    >
                      <Icon className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className={meta.badgeClass}>
                          {meta.label}
                        </Badge>
                        {notification.batch ? (
                          <span className="text-xs text-muted-foreground">
                            {notification.batch.title ??
                              `Batch ${notification.batch.batchNumber}`}
                          </span>
                        ) : null}
                        <span
                          className="ml-auto text-xs text-muted-foreground"
                          title={notification.createdAt}
                        >
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "mt-1.5 text-sm",
                          isUnread ? "font-semibold" : "font-normal text-foreground/80"
                        )}
                      >
                        {notification.title}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        {notification.link ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                            View
                            <ArrowRight className="size-3" />
                          </span>
                        ) : null}
                        {isUnread ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                            onClick={(event) => {
                              event.stopPropagation();
                              markReadMutation.mutate(notification.id);
                            }}
                          >
                            <Check className="size-3" />
                            Mark as read
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-slate-200/60 hover:text-foreground"
                      aria-label="Delete notification"
                      title="Delete"
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteMutation.mutate(notification.id);
                      }}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>Clear read notifications?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all notifications you have already
              read. Unread notifications stay.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => clearReadMutation.mutate()}
              disabled={clearPending}
            >
              {clearPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Clear Read
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
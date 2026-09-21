"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock,
  Loader2,
  Radio,
  RefreshCcw,
} from "lucide-react";
import { cn } from "cn";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { LiveSession, LiveSessionStatus, MyLiveSessionsData } from "@/types";
import {
  getSessionStatus,
  SupportSessionCard,
} from "@/components/learner/SupportSessionCard";
import { SupportSessionEmptyState } from "@/components/learner/SupportSessionEmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

function StatCard({
  icon: Icon,
  value,
  label,
  iconCls,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
  iconCls: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <span
          className={cn(
            "inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-white",
            iconCls
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-2xl font-bold tabular-nums">{value}</p>
          <p className="truncate text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SupportSessionsPage() {
  const { user } = useAuth();
  const learnerId = user?.id ?? "";

  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const sessionsQuery = useQuery({
    queryKey: ["live-sessions", "my", learnerId],
    enabled: Boolean(learnerId),
    refetchInterval: 60_000,
    queryFn: async () =>
      (
        await apiFetch<MyLiveSessionsData>(`/live-sessions/my/${learnerId}`)
      ).data,
  });

  const allSessions: LiveSession[] = React.useMemo(() => {
    const data = sessionsQuery.data;
    return [...(data?.upcoming ?? []), ...(data?.past ?? [])];
  }, [sessionsQuery.data]);

  const { live, upcoming, ended } = React.useMemo(() => {
    const grouped: Record<LiveSessionStatus, LiveSession[]> = {
      LIVE: [],
      UPCOMING: [],
      ENDED: [],
    };
    for (const session of allSessions) {
      grouped[getSessionStatus(session, now)].push(session);
    }
    const byTime = (a: LiveSession, b: LiveSession) =>
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
    const byTimeDesc = (a: LiveSession, b: LiveSession) =>
      new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime();

    grouped.UPCOMING.sort(byTime);
    grouped.LIVE.sort(byTime);
    grouped.ENDED.sort(byTimeDesc);
    return {
      live: grouped.LIVE,
      upcoming: grouped.UPCOMING,
      ended: grouped.ENDED,
    };
  }, [allSessions, now]);

  const total = live.length + upcoming.length + ended.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Support Sessions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Join your live support sessions
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Radio}
          value={live.length}
          label="Live Now"
          iconCls="bg-red-500"
        />
        <StatCard
          icon={Clock}
          value={upcoming.length}
          label="Upcoming"
          iconCls="bg-amber-500"
        />
        <StatCard
          icon={CheckCircle2}
          value={ended.length}
          label="Ended"
          iconCls="bg-emerald-500"
        />
      </div>

      {sessionsQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : sessionsQuery.isError || !sessionsQuery.data ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <Loader2 className="mx-auto size-10 animate-spin text-indigo-400" />
          <p className="mt-3 font-medium">Couldn&apos;t load your sessions</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {sessionsQuery.error instanceof Error
              ? sessionsQuery.error.message
              : "Please try again."}
          </p>
          <button
            type="button"
            onClick={() => sessionsQuery.refetch()}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:underline"
          >
            <RefreshCcw className="size-4" />
            Try again
          </button>
        </div>
      ) : total === 0 ? (
        <SupportSessionEmptyState />
      ) : (
        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">
              Upcoming ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="live">
              Live Now ({live.length})
            </TabsTrigger>
            <TabsTrigger value="past">Past ({ended.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-4">
            {upcoming.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {upcoming.map((session) => (
                  <SupportSessionCard
                    key={session.id}
                    session={session}
                    now={now}
                  />
                ))}
              </div>
            ) : (
              <EmptyTabNote text="No upcoming support sessions." />
            )}
          </TabsContent>

          <TabsContent value="live" className="mt-4">
            {live.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {live.map((session) => (
                  <SupportSessionCard
                    key={session.id}
                    session={session}
                    now={now}
                  />
                ))}
              </div>
            ) : (
              <EmptyTabNote text="Nothing live right now. Check back at your next session time." />
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-4">
            {ended.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {ended.map((session) => (
                  <SupportSessionCard
                    key={session.id}
                    session={session}
                    now={now}
                  />
                ))}
              </div>
            ) : (
              <EmptyTabNote text="No past support sessions." />
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function EmptyTabNote({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
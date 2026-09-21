"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Award,
  Bell,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Lock,
  TrendingUp,
  User as UserIcon,
} from "lucide-react";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { AvatarPicker } from "@/components/profile/AvatarPicker";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { SecurityTab } from "@/components/profile/SecurityTab";
import { StatCard } from "@/components/profile/StatCard";
import type { LearnerDashboardData } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ActivityStat = {
  key: string;
  label: string;
  value: string;
  subtext?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
};

function buildActivityStats(data: LearnerDashboardData | null): ActivityStat[] {
  const enrollments = data?.enrollments;
  const recentEnrollments = data?.recentEnrollments ?? [];
  const notifications = data?.notifications;

  const avgProgress =
    recentEnrollments.length > 0
      ? Math.round(
          recentEnrollments.reduce(
            (sum, item) => sum + (item.progress || 0),
            0
          ) / recentEnrollments.length
        )
      : 0;

  return [
    {
      key: "enrolled",
      label: "Enrolled",
      value: String(enrollments?.total ?? 0),
      subtext: `${enrollments?.active ?? 0} active`,
      icon: BookOpen,
      iconBg: "bg-blue-100 text-blue-600",
    },
    {
      key: "completed",
      label: "Completed",
      value: String(enrollments?.completed ?? 0),
      subtext: "courses",
      icon: CheckCircle2,
      iconBg: "bg-emerald-100 text-emerald-600",
    },
    {
      key: "certificates",
      label: "Certificates",
      value: String(data?.certificates ?? 0),
      subtext: "earned",
      icon: Award,
      iconBg: "bg-amber-100 text-amber-600",
    },
    {
      key: "assignments",
      label: "Assignments",
      value: String(data?.assignments ?? 0),
      subtext: "submitted",
      icon: ClipboardList,
      iconBg: "bg-purple-100 text-purple-600",
    },
    {
      key: "notifications",
      label: "Notifications",
      value: String(notifications?.total ?? 0),
      subtext: `${notifications?.unread ?? 0} unread`,
      icon: Bell,
      iconBg: "bg-rose-100 text-rose-600",
    },
    {
      key: "progress",
      label: "Avg Progress",
      value: `${avgProgress}%`,
      subtext: "across courses",
      icon: TrendingUp,
      iconBg: "bg-indigo-100 text-indigo-600",
    },
  ];
}

export default function LearnerProfilePage() {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();

  const [avatarOpen, setAvatarOpen] = React.useState(false);

  const statsQuery = useQuery({
    queryKey: ["learner-dashboard", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () =>
      (
        await apiFetch<LearnerDashboardData>(
          `/dashboard/learner/${user!.id}`
        )
      ).data,
  });

  const avatarMutation = useMutation({
    mutationFn: async (avatar: string) =>
      apiFetch(`/users/${user!.id}`, {
        method: "PATCH",
        body: { avatar },
      }),
    onSuccess: (_response, avatar) => {
      updateUser({ avatar });
      toast.success("Avatar updated successfully!");
      void queryClient.invalidateQueries({
        queryKey: ["learner-dashboard", user?.id],
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update avatar"
      );
    },
  });

  const activityStats = React.useMemo(
    () => buildActivityStats(statsQuery.data ?? null),
    [statsQuery.data]
  );

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <AvatarPicker
        open={avatarOpen}
        onOpenChange={setAvatarOpen}
        currentAvatar={user.avatar}
        name={user.name}
        onSelect={(avatar) => {
          if (avatar) avatarMutation.mutate(avatar);
        }}
      />

      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account information and preferences
        </p>
      </div>

      <ProfileHeader user={user} onChangeAvatar={() => setAvatarOpen(true)} />

      <Tabs defaultValue="profile" className="w-full">
        <div className="overflow-x-auto pb-1">
          <TabsList className="w-fit">
            <TabsTrigger value="profile">
              <UserIcon className="size-4" />
              Profile Info
            </TabsTrigger>
            <TabsTrigger value="security">
              <Lock className="size-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="activity">
              <TrendingUp className="size-4" />
              Activity
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="profile" className="mt-4">
          <ProfileForm user={user} />
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <SecurityTab />
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          {statsQuery.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <Skeleton key={index} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          ) : statsQuery.isError ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center py-12 text-center">
                <Bell className="size-10 text-muted-foreground" />
                <p className="mt-3 font-medium">Couldn&apos;t load activity</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => statsQuery.refetch()}
                >
                  <Loader2 className="size-4" />
                  Try again
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activityStats.map((stat) => (
                <StatCard
                  key={stat.key}
                  icon={stat.icon}
                  value={stat.value}
                  label={stat.label}
                  subtext={stat.subtext}
                  iconBg={stat.iconBg}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Award,
  BookOpen,
  ClipboardList,
  GraduationCap,
  Loader2,
  Lock,
  TrendingUp,
  Users,
  User as UserIcon,
  Wallet,
} from "lucide-react";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatPrice } from "@/lib/course-utils";
import { AvatarPicker } from "@/components/profile/AvatarPicker";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { SecurityTab } from "@/components/profile/SecurityTab";
import { StatCard } from "@/components/profile/StatCard";
import type { AdminStats, Course, CourseListData } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminProfilePage() {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();

  const [avatarOpen, setAvatarOpen] = React.useState(false);

  const statsQuery = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () =>
      (await apiFetch<AdminStats>("/dashboard/admin/stats")).data,
  });

  const coursesQuery = useQuery({
    queryKey: ["courses"],
    queryFn: async () => (await apiFetch<CourseListData>("/courses")).data,
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
      void queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update avatar"
      );
    },
  });

  const myCourses = React.useMemo(
    () =>
      (coursesQuery.data?.courses ?? []).filter(
        (course: Course) => course.adminId === user?.id
      ),
    [coursesQuery.data, user?.id]
  );

  const stats = statsQuery.data;

  const adminStatCards = [
    {
      key: "my-courses",
      label: "My Courses",
      value: String(myCourses.length),
      subtext: "created by you",
      icon: BookOpen,
      iconBg: "bg-violet-100 text-violet-600",
    },
    {
      key: "students",
      label: "Students",
      value: String(stats?.users.learners ?? 0),
      subtext: "total learners",
      icon: Users,
      iconBg: "bg-indigo-100 text-indigo-600",
    },
    {
      key: "enrollments",
      label: "Enrollments",
      value: String(stats?.enrollments.total ?? 0),
      subtext: `${stats?.enrollments.active ?? 0} active`,
      icon: GraduationCap,
      iconBg: "bg-emerald-100 text-emerald-600",
    },
    {
      key: "revenue",
      label: "Revenue",
      value: formatPrice(stats?.payments.totalRevenue ?? 0),
      subtext: `${stats?.payments.pendingPayments ?? 0} pending`,
      icon: Wallet,
      iconBg: "bg-amber-100 text-amber-600",
    },
    {
      key: "assignments",
      label: "Assignments",
      value: String(stats?.others.assignments ?? 0),
      subtext: "published",
      icon: ClipboardList,
      iconBg: "bg-purple-100 text-purple-600",
    },
    {
      key: "certificates",
      label: "Certificates",
      value: String(stats?.others.certificates ?? 0),
      subtext: "issued",
      icon: Award,
      iconBg: "bg-rose-100 text-rose-600",
    },
  ];

  const statsLoading =
    statsQuery.isLoading || coursesQuery.isLoading;

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
          Manage your admin account and review platform stats
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
            <TabsTrigger value="stats">
              <TrendingUp className="size-4" />
              Admin Stats
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="profile" className="mt-4">
          <ProfileForm user={user} />
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <SecurityTab />
        </TabsContent>

        <TabsContent value="stats" className="mt-4">
          {statsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <Skeleton key={index} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          ) : statsQuery.isError ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center py-12 text-center">
                <TrendingUp className="size-10 text-muted-foreground" />
                <p className="mt-3 font-medium">Couldn&apos;t load stats</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {statsQuery.error instanceof Error
                    ? statsQuery.error.message
                    : "Something went wrong."}
                </p>
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
              {adminStatCards.map((stat) => (
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
"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Mail, Save } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { User } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  bio: z.string().max(500, "Bio is too long").optional().or(z.literal("")),
  avatar: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
});

type ProfileValues = z.infer<typeof profileSchema>;

export function ProfileForm({
  user,
  onSuccess,
}: {
  user: User;
  onSuccess?: () => void;
}) {
  const { updateUser } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      bio: user.bio ?? "",
      avatar: user.avatar ?? "",
    },
  });

  React.useEffect(() => {
    reset({
      name: user.name,
      bio: user.bio ?? "",
      avatar: user.avatar ?? "",
    });
  }, [user, reset]);

  const bioWatch = watch("bio") ?? "";

  const saveProfileMutation = useMutation({
    mutationFn: async (values: ProfileValues) =>
      apiFetch(`/users/${user.id}`, {
        method: "PATCH",
        body: {
          name: values.name,
          bio: values.bio || null,
          avatar: values.avatar || null,
        },
      }),
    onSuccess: (_response, values) => {
      updateUser({
        name: values.name,
        bio: values.bio || null,
        avatar: values.avatar || null,
      });
      toast.success("Profile updated successfully!");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    },
  });

  const handleSave = handleSubmit((values) => {
    if (!user) return;
    saveProfileMutation.mutate(values);
  });

  return (
    <Card>
      <CardContent className="space-y-5 p-6">
        <div className="space-y-2">
          <Label htmlFor="profile-name">
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="profile-name"
            placeholder="Your display name"
            {...register("name")}
          />
          {errors.name ? (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              🛈 Your display name
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-email">Email (read-only)</Label>
          <div className="relative">
            <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="profile-email"
              value={user.email}
              disabled
              className="pl-9"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            🔒 Email cannot be changed
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-bio">Bio</Label>
          <Textarea
            id="profile-bio"
            rows={4}
            maxLength={500}
            placeholder="Tell us about yourself..."
            {...register("bio")}
          />
          {errors.bio ? (
            <p className="text-xs text-destructive">{errors.bio.message}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {bioWatch.length}/500 · Tell us about yourself
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-avatar">Avatar URL</Label>
          <Input
            id="profile-avatar"
            type="text"
            placeholder="https://i.pravatar.cc/300?img=12"
            {...register("avatar")}
          />
          {errors.avatar ? (
            <p className="text-xs text-destructive">{errors.avatar.message}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Paste a link to your profile photo, or use the camera on your
              profile picture.
            </p>
          )}
        </div>

        <Button
          type="button"
          onClick={() => handleSave()}
          disabled={saveProfileMutation.isPending}
          className="w-full sm:w-auto"
        >
          {saveProfileMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Save Changes
        </Button>
      </CardContent>
    </Card>
  );
}
"use client";

import * as React from "react";
import { Calendar, Camera, GraduationCap, Mail, ShieldCheck } from "lucide-react";

import { formatDate } from "@/lib/course-utils";
import type { User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase() || "?";
}

export function ProfileHeader({
  user,
  onChangeAvatar,
}: {
  user: User;
  onChangeAvatar: () => void;
}) {
  const isAdmin = user.role === "ADMIN";

  return (
    <Card className="overflow-hidden">
      <div className="h-20 bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500" />
      <CardContent className="relative p-6">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">
          <div className="relative -mt-14">
            <Avatar className="size-24 ring-4 ring-background">
              {user.avatar ? (
                <AvatarImage src={user.avatar} alt={user.name} />
              ) : null}
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-2xl font-bold text-white">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={onChangeAvatar}
              className="absolute right-0 bottom-0 inline-flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
              aria-label="Change profile picture"
              title="Change profile picture"
            >
              <Camera className="size-4" />
            </button>
          </div>
          <div className="min-w-0 flex-1 pb-1">
            <h2 className="truncate text-2xl font-bold tracking-tight">
              {user.name}
            </h2>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="size-3.5" />
              {user.email}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge
                className={
                  isAdmin
                    ? "bg-purple-100 text-purple-700"
                    : "bg-blue-100 text-blue-700"
                }
              >
                {isAdmin ? (
                  <ShieldCheck className="size-3" />
                ) : (
                  <GraduationCap className="size-3" />
                )}
                {isAdmin ? "ADMIN" : "LEARNER"}
              </Badge>
              <Badge variant="secondary" className="text-muted-foreground">
                <Calendar className="size-3" />
                Joined {formatDate(user.createdAt)}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
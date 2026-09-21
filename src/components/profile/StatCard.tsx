"use client";

import * as React from "react";
import { cn } from "cn";

import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  icon: Icon,
  value,
  label,
  subtext,
  iconBg,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
  subtext?: string;
  iconBg: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <span
          className={cn(
            "inline-flex size-11 shrink-0 items-center justify-center rounded-xl",
            iconBg
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xl font-bold tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground">
            {label}
            {subtext ? ` · ${subtext}` : ""}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
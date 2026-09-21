"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Info, Lock, Mail, ShieldCheck } from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function SecurityTab() {
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex items-start gap-4 p-6">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <Lock className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Password &amp; Security</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Password change is coming soon. If you need to change your
              password now, please contact support.
            </p>
            <Button
              variant="outline"
              className="mt-3"
              onClick={() =>
                router.push(
                  isAdmin ? "/admin/notifications" : "/learner/notifications"
                )
              }
            >
              <ShieldCheck className="size-4" />
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>

      {user ? (
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Mail className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Email</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {user.email}
              </p>
            </div>
            <Badge variant="secondary" className="shrink-0">
              <Lock className="size-3" />
              Cannot be changed
            </Badge>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex items-center gap-2 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
        <Info className="size-4 shrink-0" />
        Password change is coming soon. We&apos;ll notify you once it&apos;s
        available.
      </div>
    </div>
  );
}
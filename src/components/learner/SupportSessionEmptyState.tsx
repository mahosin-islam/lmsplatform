"use client";

import { Headphones, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SupportSessionEmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card p-12 text-center">
      <span className="inline-flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600">
        <Headphones className="size-8" />
      </span>
      <div>
        <p className="text-lg font-semibold">No Support Sessions</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Support Sessions are not available for your course.
        </p>
      </div>
      <p className="max-w-sm text-sm text-muted-foreground">
        Need assistance? Our support team is available through our email
        support system.
      </p>
      <a href="mailto:support@lmsplatform.com" className="mt-2">
        <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600">
          <Mail className="size-4" />
          support@lmsplatform.com
        </Button>
      </a>
    </div>
  );
}
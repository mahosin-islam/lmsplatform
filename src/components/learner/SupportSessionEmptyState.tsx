"use client";

import { Headphones, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SupportSessionEmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card p-12 text-center">
      <span className="inline-flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
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
        <Button className="bg-emerald-600 text-white hover:bg-emerald-700">
          <Mail className="size-4" />
          support@lmsplatform.com
        </Button>
      </a>
    </div>
  );
}
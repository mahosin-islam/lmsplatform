"use client";

import * as React from "react";
import { toast } from "sonner";
import { BadgeCheck, Copy } from "lucide-react";

import {
  copyToClipboard,
  formatPrice,
  shortenTx,
  timeAgo,
} from "@/lib/course-utils";
import {
  ORDER_BADGE,
  PROVIDER_BADGE,
  PROVIDER_LABEL,
} from "@/lib/payment-utils";
import type { Order, PaymentStatus } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function getUserInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase() || "?";
}

function copyText(text: string, label: string): void {
  void copyToClipboard(text).then((ok) => {
    if (ok) toast.success(`${label} copied to clipboard`);
    else toast.error("Could not copy to clipboard");
  });
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <div className="flex min-w-0 items-center justify-end gap-1.5 text-right">
        {children}
      </div>
    </div>
  );
}

function CopyButton({
  value,
  label,
  hidden = false,
}: {
  value: string | null | undefined;
  label: string;
  hidden?: boolean;
}) {
  if (!value) return <span className="text-sm">\u2014</span>;
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <button
        type="button"
        onClick={() => copyText(value, label)}
        className="truncate text-sm hover:underline"
        title={value}
      >
        {hidden ? shortenTx(value) : value}
      </button>
      <button
        type="button"
        onClick={() => copyText(value, label)}
        className="shrink-0 text-muted-foreground hover:text-foreground"
        aria-label={`Copy ${label}`}
      >
        <Copy className="size-3.5" />
      </button>
    </div>
  );
}

export function PaymentDetailDialog({
  open,
  onOpenChange,
  order,
  onRequestApprove,
  onRequestReject,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  onRequestApprove?: (order: Order) => void;
  onRequestReject?: (order: Order) => void;
}) {
  const isPending = order?.status === "PENDING";
  const showActions = isPending && Boolean(onRequestApprove) && Boolean(onRequestReject);

  return (
    <Dialog open={open && Boolean(order)} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-md"
        onKeyDown={(event) => {
          if (event.key === "Enter") event.stopPropagation();
        }}
      >
        <DialogHeader>
          <DialogTitle>Payment details</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              {order?.id}
            </span>
            {order ? (
              <Badge
                variant="secondary"
                className={ORDER_BADGE[order.status as PaymentStatus]}
              >
                {order.status}
              </Badge>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        {order ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <Avatar className="size-10">
                {order.learner?.avatar ? (
                  <AvatarImage
                    src={order.learner.avatar}
                    alt={order.learner?.name ?? "Student"}
                  />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {getUserInitials(order.learner?.name ?? "?")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {order.learner?.name ?? "Unknown"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {order.learner?.email}
                </p>
              </div>
            </div>

            <div className="flex items-end justify-between gap-3 rounded-lg border p-3">
              <div>
                <p className="truncate font-medium">
                  {order.course?.title ?? "Course"}
                </p>
                {order.batch ? (
                  <p className="text-xs text-muted-foreground">
                    Batch {order.batch.batchNumber}
                  </p>
                ) : null}
              </div>
              <p className="text-2xl font-bold tabular-nums">
                {formatPrice(order.amount)}
              </p>
            </div>

            <div className="space-y-2.5 rounded-lg border p-3 text-sm">
              <Row label="Provider">
                {order.provider ? (
                  <Badge
                    variant="secondary"
                    className={PROVIDER_BADGE[order.provider]}
                  >
                    {PROVIDER_LABEL[order.provider]}
                  </Badge>
                ) : (
                  <span className="text-sm">\u2014</span>
                )}
              </Row>
              <Row label="Sender number">
                <CopyButton value={order.senderNumber} label="Sender number" />
              </Row>
              <Row label="Transaction ID">
                <CopyButton
                  value={order.transactionId}
                  label="Transaction ID"
                  hidden
                />
              </Row>
              <Row label="Submitted">
                <span className="text-sm">{timeAgo(order.createdAt)}</span>
              </Row>
              {order.status !== "PENDING" ? (
                <Row label="Last updated">
                  <span className="text-sm">{timeAgo(order.updatedAt)}</span>
                </Row>
              ) : null}
            </div>

            {showActions ? (
              <DialogFooter>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => onRequestReject?.(order)}
                >
                  Reject
                </Button>
                <Button size="sm" onClick={() => onRequestApprove?.(order)}>
                  <BadgeCheck className="size-4" />
                  Approve
                </Button>
              </DialogFooter>
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
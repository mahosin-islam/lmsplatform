"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Clock, Copy, CreditCard, ExternalLink } from "lucide-react";

import {
  copyToClipboard,
  formatDate,
  formatPrice,
  shortenTx,
} from "@/lib/course-utils";
import { PROVIDER_LABEL } from "@/lib/payment-utils";
import type { Order, PaymentProvider, PaymentStatus } from "@/types";
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

const STATUS_BADGE: Record<PaymentStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PAID: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-red-100 text-red-700",
  REFUNDED: "bg-slate-200 text-slate-600",
};

const PROVIDER_BADGE: Record<PaymentProvider, string> = {
  BKASH: "bg-pink-100 text-pink-700",
  NAGAD: "bg-orange-100 text-orange-700",
  FREE: "bg-emerald-100 text-emerald-700",
};

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
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
  const copyText = (): void => {
    void copyToClipboard(value).then((ok) => {
      if (ok) toast.success(`${label} copied`);
      else toast.error("Could not copy");
    });
  };
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <button
        type="button"
        onClick={copyText}
        className="truncate text-sm hover:underline"
        title={value}
      >
        {hidden ? shortenTx(value) : value}
      </button>
      <button
        type="button"
        onClick={copyText}
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
  enrollmentId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  enrollmentId?: string | null;
}) {
  const isPending = order?.status === "PENDING";
  const hasSubmittedInfo = Boolean(order?.transactionId || order?.senderNumber);
  const showCompletePayment =
    isPending && !hasSubmittedInfo && Boolean(enrollmentId);

  return (
    <Dialog open={open && Boolean(order)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Payment details</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              {order?.id}
            </span>
            {order ? (
              <Badge
                variant="secondary"
                className={STATUS_BADGE[order.status]}
              >
                {order.status}
              </Badge>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        {order ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              {order.course?.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={order.course.thumbnail}
                  alt={order.course.title ?? "Course"}
                  className="size-10 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                  <CreditCard className="size-4" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {order.course?.title ?? "Course"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {order.batch
                    ? `Batch ${order.batch.batchNumber}`
                    : "Self-paced"}
                </p>
              </div>
              <p className="text-xl font-bold tabular-nums">
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
              <Row label="Created">
                <span className="text-sm">{formatDate(order.createdAt)}</span>
              </Row>
              {order.status !== "PENDING" ? (
                <Row label="Paid">
                  <span className="text-sm">{formatDate(order.updatedAt)}</span>
                </Row>
              ) : null}
            </div>

            {isPending ? (
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <Clock className="mt-0.5 size-4 shrink-0 text-amber-600" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-amber-800">
                    Your payment is under review
                  </p>
                  <p className="mt-0.5 text-xs text-amber-700">
                    Usually completed within 24 hours. You&apos;ll be notified
                    once the admin approves it.
                  </p>
                </div>
              </div>
            ) : null}

            <DialogFooter>
              {showCompletePayment && enrollmentId ? (
                <Button
                  nativeButton={false}
                  className="w-full"
                  render={
                    <Link href={`/checkout/${enrollmentId}`}>
                      <ExternalLink className="size-4" />
                      Complete Payment
                    </Link>
                  }
                />
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
              )}
            </DialogFooter>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
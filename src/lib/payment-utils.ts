import type { PaymentProvider, PaymentStatus } from "@/types";

export const ORDER_BADGE: Record<PaymentStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  PAID: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  FAILED: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  REFUNDED: "bg-muted text-muted-foreground",
};

export const PROVIDER_BADGE: Record<PaymentProvider, string> = {
  BKASH: "bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300",
  NAGAD: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  FREE: "bg-muted text-muted-foreground",
};

export const PROVIDER_LABEL: Record<PaymentProvider, string> = {
  BKASH: "bKash",
  NAGAD: "Nagad",
  FREE: "Free",
};
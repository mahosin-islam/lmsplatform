import type { PaymentProvider, PaymentStatus } from "@/types";

export const ORDER_BADGE: Record<PaymentStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PAID: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-red-100 text-red-700",
  REFUNDED: "bg-slate-200 text-slate-600",
};

export const PROVIDER_BADGE: Record<PaymentProvider, string> = {
  BKASH: "bg-pink-100 text-pink-700",
  NAGAD: "bg-orange-100 text-orange-700",
  FREE: "bg-slate-100 text-slate-600",
};

export const PROVIDER_LABEL: Record<PaymentProvider, string> = {
  BKASH: "bKash",
  NAGAD: "Nagad",
  FREE: "Free",
};
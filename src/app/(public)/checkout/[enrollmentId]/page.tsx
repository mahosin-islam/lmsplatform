"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  CreditCard,
  Loader2,
  Lock,
  Smartphone,
  Wallet,
} from "lucide-react";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { copyToClipboard, formatDate, formatPrice } from "@/lib/course-utils";
import type {
  Enrollment,
  Order,
  OrderListData,
  PaymentProvider,
} from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

type CheckoutProvider = Extract<PaymentProvider, "BKASH" | "NAGAD">;

const PROVIDER_LABEL: Record<CheckoutProvider, string> = {
  BKASH: "bKash",
  NAGAD: "Nagad",
};

const PAYMENT_METHODS: {
  provider: CheckoutProvider;
  label: string;
  number: string;
}[] = [
  { provider: "BKASH", label: "bKash (Personal)", number: "01712345678" },
  { provider: "NAGAD", label: "Nagad (Personal)", number: "01712345678" },
];

const paymentSchema = z.object({
  provider: z.enum(["BKASH", "NAGAD"]),
  senderNumber: z
    .string()
    .trim()
    .refine(
      (value) => /^01[3-9]\d{8}$/.test(value),
      "Enter a valid 11-digit Bangladeshi number"
    ),
  transactionId: z
    .string()
    .trim()
    .min(6, "Enter the transaction ID from your SMS")
    .max(30, "Transaction ID is too long"),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

const DEFAULT_VALUES: PaymentFormValues = {
  provider: "BKASH",
  senderNumber: "",
  transactionId: "",
};

function formatPhone(number: string): string {
  return number.replace(/(\d{5})(\d{6})/, "$1-$2");
}

export default function CheckoutPage() {
  const params = useParams<{ enrollmentId: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const enrollmentId = params?.enrollmentId ?? "";

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const enrollmentQuery = useQuery({
    queryKey: ["enrollment", enrollmentId],
    enabled: Boolean(enrollmentId),
    queryFn: async () =>
      (await apiFetch<Enrollment>(`/enrollments/${enrollmentId}`)).data,
  });

  const enrollment = enrollmentQuery.data;

  // Get learner's orders
  const paymentsQuery = useQuery({
    queryKey: ["payments", "my", enrollment?.learnerId],
    enabled: Boolean(enrollment?.learnerId),
    queryFn: async () =>
      (
        await apiFetch<OrderListData>(`/payments/my/${enrollment!.learnerId}`)
      ).data,
  });

  // Find matching order
  const matchingOrder = React.useMemo(() => {
    if (!enrollment || !paymentsQuery.data) return null;
    return (
      paymentsQuery.data.orders?.find(
        (order) =>
          order.courseId === enrollment.courseId &&
          (order.batchId ?? null) === (enrollment.batchId ?? null)
      ) ?? null
    );
  }, [enrollment, paymentsQuery.data]);

  const submitMutation = useMutation({
    mutationFn: async (values: PaymentFormValues) =>
      apiFetch<Order>("/payments/submit", {
        method: "POST",
        body: {
          enrollmentId,
          senderNumber: values.senderNumber,
          transactionId: values.transactionId,
          provider: values.provider as CheckoutProvider,
        },
      }),
    onSuccess: () => {
      toast.success("Payment submitted! Waiting for verification.");
      router.push(`/checkout/${enrollmentId}/success`);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not submit payment"
      );
    },
  });

  // Not logged in → go to login and come back here.
  React.useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(
        `/login?redirect=${encodeURIComponent(`/checkout/${enrollmentId}`)}`
      );
    }
  }, [authLoading, user, router, enrollmentId]);

  // Already ACTIVE or paid → nothing to pay.
  React.useEffect(() => {
    if (enrollment?.status === "ACTIVE" || matchingOrder?.status === "PAID") {
      router.replace("/learner/courses");
    }
  }, [enrollment?.status, matchingOrder?.status, router]);

  // Already submitted (PENDING with transactionId) → show success page.
  React.useEffect(() => {
    if (matchingOrder?.transactionId && matchingOrder.status === "PENDING") {
      router.replace(`/checkout/${enrollmentId}/success`);
    }
  }, [matchingOrder, router, enrollmentId]);

  const handleCopy = (number: string) => {
    void copyToClipboard(number).then((ok) => {
      if (ok) toast.success("Copied!");
      else toast.error("Could not copy to clipboard");
    });
  };

  if (authLoading || !user || enrollmentQuery.isLoading || paymentsQuery.isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="mt-4 space-y-3">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (enrollmentQuery.isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed p-12 text-center">
          <span className="inline-flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="size-6" />
          </span>
          <div>
            <p className="font-semibold">Could not load this enrollment</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {enrollmentQuery.error instanceof Error
                ? enrollmentQuery.error.message
                : "Please try again."}
            </p>
          </div>
          <Button variant="outline" onClick={() => enrollmentQuery.refetch()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (!enrollment) return null;

  // Already submitted payment for this enrollment → redirecting to success page.
  if (matchingOrder?.transactionId && matchingOrder.status === "PENDING") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Redirecting to /learner/courses (already paid).
  if (enrollment.status === "ACTIVE") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-center sm:px-6">
        <Loader2 className="mx-auto size-8 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">
          You&apos;re already enrolled. Taking you to your courses…
        </p>
      </div>
    );
  }

  if (enrollment.status === "CANCELLED") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed p-12 text-center">
          <span className="inline-flex size-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertCircle className="size-6" />
          </span>
          <div>
            <p className="font-semibold">This enrollment was cancelled</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your payment could not be verified. Please re-enroll to try again
              or contact admin for help.
            </p>
          </div>
          {enrollment.course?.slug ? (
            <Button
              nativeButton={false}
              render={
                <Link href={`/courses/${enrollment.course.slug}`} />
              }
            >
              Re-enroll
              <ArrowLeft className="size-4 rotate-180" />
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  const course = enrollment.course;
  const amount = course?.price ?? 0;
  const batch = enrollment.batch;

  const onSubmit = (values: PaymentFormValues) => {
    submitMutation.mutate(values);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href={course?.slug ? `/courses/${course.slug}` : "/courses"}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to course
      </Link>

      <div className="mt-4 text-center sm:text-left">
        <h1 className="text-2xl font-bold tracking-tight">
          Complete Your Enrollment
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          One step away from starting your course
        </p>
      </div>

      <div className="mt-6 space-y-6">
        {/* Order summary */}
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-base font-semibold">
            <Wallet className="size-4 text-muted-foreground" />
            Order Summary
          </h2>
          <Card>
            <CardContent className="flex flex-wrap items-center gap-4 p-5">
              {course?.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="size-20 shrink-0 rounded-xl border object-cover"
                />
              ) : (
                <span className="inline-flex size-20 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                  <CreditCard className="size-8" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{course?.title ?? "Course"}</p>
                {batch ? (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Batch {batch.batchNumber}
                    {batch.title ? ` · ${batch.title}` : ""}
                    {batch.startDate ? ` · ${formatDate(batch.startDate)}` : ""}
                  </p>
                ) : (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Self-paced course
                  </p>
                )}
                {course?.level ? (
                  <Badge
                    variant="secondary"
                    className="mt-1.5 bg-slate-100 text-slate-700"
                  >
                    {course.level}
                  </Badge>
                ) : null}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className="text-xl font-bold tracking-tight">
                  {formatPrice(amount)}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Payment instructions */}
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-base font-semibold">
            <Smartphone className="size-4 text-muted-foreground" />
            Payment Instructions
          </h2>
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="space-y-4 p-5">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Step 1:</span>{" "}
                Send{" "}
                <span className="font-semibold text-foreground">
                  {formatPrice(amount)}
                </span>{" "}
                to one of these numbers:
              </p>
              <div className="space-y-2">
                {PAYMENT_METHODS.map((method) => (
                  <div
                    key={method.provider}
                    className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex size-9 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                        <Smartphone className="size-4" />
                      </span>
                      <div>
                        <p className="text-sm font-medium">
                          {method.label}
                        </p>
                        <p className="text-base font-bold tabular-nums">
                          {formatPhone(method.number)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(method.number)}
                    >
                      <Copy className="size-3.5" />
                      Copy
                    </Button>
                  </div>
                ))}
              </div>
              <p className="border-t pt-3 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Step 2:</span>{" "}
                After sending the money, submit your sender number and
                transaction ID below.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Submit payment info */}
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-base font-semibold">
            <CreditCard className="size-4 text-muted-foreground" />
            Submit Payment Info
          </h2>
          <Card>
            <CardContent>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4"
                noValidate
              >
                <div className="space-y-2">
                  <Label htmlFor="provider">Provider</Label>
                  <Controller
                    name="provider"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id="provider" className="w-full">
                          <SelectValue>
                            {(value: string | undefined) =>
                              value
                                ? PROVIDER_LABEL[value as CheckoutProvider]
                                : "Select payment method"
                            }
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_METHODS.map((method) => (
                            <SelectItem
                              key={method.provider}
                              value={method.provider}
                            >
                              {method.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.provider ? (
                    <p className="text-xs text-destructive">
                      {errors.provider.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senderNumber">Sender Number</Label>
                  <Input
                    id="senderNumber"
                    type="tel"
                    inputMode="numeric"
                    placeholder="01712-345678"
                    aria-invalid={Boolean(errors.senderNumber)}
                    {...register("senderNumber")}
                  />
                  <p className="text-xs text-muted-foreground">
                    যেই নাম্বার থেকে পাঠিয়েছো
                  </p>
                  {errors.senderNumber ? (
                    <p className="text-xs text-destructive">
                      {errors.senderNumber.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transactionId">Transaction ID</Label>
                  <Input
                    id="transactionId"
                    placeholder="e.g. 8F3K2H9T"
                    aria-invalid={Boolean(errors.transactionId)}
                    {...register("transactionId")}
                  />
                  <p className="text-xs text-muted-foreground">
                    bKash/Nagad এ SMS এ পাবে
                  </p>
                  {errors.transactionId ? (
                    <p className="text-xs text-destructive">
                      {errors.transactionId.message}
                    </p>
                  ) : null}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitMutation.isPending}
                >
                  {submitMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )}
                  {submitMutation.isPending
                    ? "Submitting..."
                    : "Submit Payment"}
                </Button>

                <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                  <Lock className="size-3.5" />
                  Secure payment — your details are only used to verify your
                  transaction.
                </p>
              </form>
            </CardContent>
          </Card>
        </section>

        {/* Trust/time notice */}
        <p className="text-center text-sm text-muted-foreground">
          ⏱️ After submission, admin will verify within 24 hours. You&apos;ll
          get a notification once it&apos;s done.
        </p>
      </div>
    </div>
  );
}
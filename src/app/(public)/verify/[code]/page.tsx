"use client";

import Link from "next/link";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CheckCircle2, GraduationCap, Loader2, XCircle } from "lucide-react";

import { BASE_URL } from "@/lib/api";
import type { Certificate } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type VerifyPayload = {
  data: { isValid: boolean; certificate: Certificate };
};

async function verifyCertificate(code: string): Promise<{
  isValid: boolean;
  certificate: Certificate | null;
  message?: string;
}> {
  const res = await fetch(
    `${BASE_URL}/certificates/verify/${encodeURIComponent(code)}`
  );
  const payload = (await res.json().catch(() => null)) as VerifyPayload | null;
  if (!res.ok || !payload) {
    return {
      isValid: false,
      certificate: null,
      message: "Certificate could not be verified",
    };
  }
  return {
    isValid: Boolean(payload.data?.isValid),
    certificate: payload.data?.certificate ?? null,
  };
}

export default function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);

  const verifyQuery = useQuery({
    queryKey: ["verify", code],
    enabled: Boolean(code),
    queryFn: () => verifyCertificate(code),
  });

  const isLoading = verifyQuery.isLoading;
  const result = verifyQuery.data;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
            <GraduationCap className="size-6" />
          </span>
          <h1 className="mt-3 text-xl font-bold tracking-tight">
            Certificate Verification
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Code: <span className="font-mono">{code}</span>
          </p>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
              <p className="text-sm font-medium">Verifying certificate…</p>
              <p className="text-xs text-muted-foreground">
                Checking authenticity with the registry
              </p>
            </CardContent>
          </Card>
        ) : result?.isValid && result.certificate ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
              <span className="inline-flex size-16 items-center justify-center rounded-full bg-emerald-500 text-white">
                <CheckCircle2 className="size-9" />
              </span>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-emerald-700">
                Certificate Verified
              </h2>
              <p className="mt-1 text-sm text-emerald-700/70">
                This certificate is authentic.
              </p>
              <Badge className="mt-3 bg-emerald-600 text-white">
                Authentic
              </Badge>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                    <GraduationCap className="size-6" />
                  </span>
                  <p className="text-lg font-bold tracking-tight">
                    {result.certificate.courseName}
                  </p>
                </div>
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <p>
                    Awarded to:{" "}
                    <span className="font-semibold text-foreground">
                      {result.certificate.learnerName}
                    </span>
                  </p>
                  {result.certificate.batchName ? (
                    <p>
                      Batch:{" "}
                      <span className="font-medium text-foreground">
                        {result.certificate.batchName}
                      </span>
                    </p>
                  ) : null}
                  <p>
                    Issued:{" "}
                    <span className="font-medium text-foreground">
                      {result.certificate.issuedAt
                        ? format(
                            new Date(result.certificate.issuedAt),
                            "MMM d, yyyy"
                          )
                        : "—"}
                    </span>
                  </p>
                  <p className="font-mono text-xs">
                    Code: {result.certificate.certificateCode}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <span className="inline-flex size-16 items-center justify-center rounded-full bg-red-500 text-white">
              <XCircle className="size-9" />
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-red-700">
              Invalid Certificate
            </h2>
            <p className="mt-2 text-sm text-red-700/70">
              This certificate could not be verified. Check the code again.
            </p>
            {verifyQuery.error ? (
              <p className="mt-2 text-xs text-red-700/60">
                {verifyQuery.error instanceof Error
                  ? verifyQuery.error.message
                  : ""}
              </p>
            ) : null}
          </div>
        )}

        <div className="mt-8 text-center">
          <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
            Back to Home
          </Button>
        </div>
      </div>
    </main>
  );
}
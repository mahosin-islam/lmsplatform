"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Download,
  Eye,
  Hourglass,
  Key,
  Loader2,
  RefreshCcw,
  Sparkles,
  Trophy,
} from "lucide-react";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { downloadCertificatePDF } from "@/utils/certificate-pdf";
import type {
  Certificate,
  CertificateListData,
  EnrollmentListData,
} from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CertificateViewDialog } from "@/components/learner/CertificateViewDialog";

type EnrollmentLike = {
  id: string;
  status: string;
  progress: number;
  course?: {
    id: string;
    title: string;
    thumbnail: string | null;
    courseType: string;
  } | null;
  batch?: {
    id: string;
    batchNumber: number;
    title?: string | null;
    certificateUnlocked?: boolean;
  } | null;
};

function StatCard({
  icon: Icon,
  value,
  label,
  iconBg,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
  iconBg: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <span
          className={`inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-white ${iconBg}`}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LearnerCertificatesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = React.useState("earned");
  const [selectedCert, setSelectedCert] = React.useState<Certificate | null>(
    null
  );
  const [loadingId, setLoadingId] = React.useState<string | null>(null);
  const [downloadingId, setDownloadingId] = React.useState<string | null>(
    null
  );

  const learnerId = user?.id ?? "";

  const enrollmentsQuery = useQuery({
    queryKey: ["enrollments", "my", learnerId],
    enabled: Boolean(learnerId),
    queryFn: async () =>
      (await apiFetch<EnrollmentListData>(`/enrollments/my/${learnerId}`)).data,
  });

  const certsQuery = useQuery({
    queryKey: ["certificates", "my", learnerId],
    enabled: Boolean(learnerId),
    queryFn: async () =>
      (await apiFetch<CertificateListData>(`/certificates/my/${learnerId}`))
        .data,
  });

  const enrollments = React.useMemo<EnrollmentLike[]>(
    () => enrollmentsQuery.data?.enrollments ?? [],
    [enrollmentsQuery.data]
  );
  const certificates = React.useMemo<Certificate[]>(
    () => certsQuery.data?.certificates ?? [],
    [certsQuery.data]
  );

  const pendingCerts = React.useMemo(() => {
    const certKeys = new Set(
      certificates.map(
        (c) => `${c.courseId}::${c.batchId ?? "none"}`
      )
    );
    return enrollments.filter((e) => {
      const key = `${e.course?.id}::${e.batch?.id ?? "none"}`;
      if (certKeys.has(key)) return false;

      // Must be complete
      if (e.progress !== 100 && e.status !== "COMPLETED") return false;

      // BATCH course: require admin unlock
      if (e.batch) {
        return e.batch.certificateUnlocked === true;
      }
      // FIXED course: always ready
      return true;
    });
  }, [enrollments, certificates]);

  const waitingCerts = React.useMemo(() => {
    const certKeys = new Set(
      certificates.map((c) => `${c.courseId}::${c.batchId ?? "none"}`)
    );
    return enrollments.filter((e) => {
      const key = `${e.course?.id}::${e.batch?.id ?? "none"}`;
      if (certKeys.has(key)) return false;
      if (e.progress !== 100 && e.status !== "COMPLETED") return false;
      // Only BATCH courses where admin hasn't unlocked
      return Boolean(e.batch) && e.batch?.certificateUnlocked !== true;
    });
  }, [enrollments, certificates]);

  const generateMutation = useMutation({
    mutationFn: async (enrollment: EnrollmentLike) => {
      if (!user?.id || !enrollment.course?.id) {
        throw new Error("Missing learner or course");
      }
      return apiFetch<Certificate>("/certificates/generate", {
        method: "POST",
        body: {
          learnerId: user.id,
          courseId: enrollment.course.id,
          batchId: enrollment.batch?.id || undefined,
        },
      });
    },
    onSuccess: (res) => {
      toast.success("Certificate generated!");
      queryClient.invalidateQueries({
        queryKey: ["certificates", "my", user?.id],
      });
      setActiveTab("earned");
      if (res.data) setSelectedCert(res.data);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to generate certificate"
      );
    },
  });

  const handleGenerate = async (enrollment: EnrollmentLike) => {
    setLoadingId(enrollment.id);
    try {
      generateMutation.mutate(enrollment);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDirectDownload = async (cert: Certificate) => {
    setDownloadingId(cert.id);
    try {
      await downloadCertificatePDF({
        learnerName: cert.learnerName || cert.learner?.name || "Learner",
        courseName: cert.courseName || cert.course?.title || "Course",
        batchName: cert.batchName || cert.batch?.title,
        certificateCode: cert.certificateCode,
        issuedAt: cert.issuedAt,
      });
      toast.success("Certificate downloaded!");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to download PDF. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const isLoading = enrollmentsQuery.isLoading || certsQuery.isLoading;
  const isError = enrollmentsQuery.isError && certsQuery.isError;

  if (isError) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center">
        <p className="font-medium">Couldn&apos;t load your certificates</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Something went wrong. Please try again.
        </p>
        <Button
          className="mt-4"
          onClick={() =>
            Promise.all([
              enrollmentsQuery.refetch(),
              certsQuery.refetch(),
            ])
          }
        >
          <RefreshCcw className="size-4" />
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Certificates</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your achievements and certifications
        </p>
      </div>

      {isLoading ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-24 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon={Award}
            value={String(certificates.length)}
            label="Earned"
            iconBg="bg-amber-500"
          />
          <StatCard
            icon={Sparkles}
            value={String(pendingCerts.length)}
            label="Ready to Generate"
            iconBg="bg-emerald-500"
          />
          <StatCard
            icon={Hourglass}
            value={String(waitingCerts.length)}
            label="Waiting for Unlock"
            iconBg="bg-sky-500"
          />
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="earned">
            Earned ({certificates.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Ready to Generate ({pendingCerts.length})
          </TabsTrigger>
          <TabsTrigger value="waiting">
            Waiting ({waitingCerts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="earned" className="mt-4">
          {certificates.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-12 text-center">
              <span className="inline-flex size-14 items-center justify-center rounded-full bg-amber-100 text-amber-500">
                <Award className="size-7" />
              </span>
              <div>
                <p className="font-medium">No certificates yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Complete a course to earn your certificate
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="rounded-xl bg-gradient-to-br from-amber-100 via-amber-50 to-yellow-50 p-[2px]"
                >
                  <Card className="border-0">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
                          <Award className="size-6" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-lg font-bold tracking-tight">
                            {cert.courseName}
                          </p>
                          {cert.batchName ? (
                            <p className="text-sm text-muted-foreground">
                              {cert.batchName}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                        <p className="flex items-center gap-2">
                          <Calendar className="size-4" />
                          Issued:{" "}
                          {cert.issuedAt
                            ? format(
                                new Date(cert.issuedAt),
                                "MMM d, yyyy"
                              )
                            : "—"}
                        </p>
                        <p className="flex items-center gap-2 font-mono text-xs">
                          <Key className="size-4" />
                          {cert.certificateCode}
                        </p>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedCert(cert)}
                        >
                          <Eye className="size-4 mr-2" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={downloadingId === cert.id}
                          onClick={() => handleDirectDownload(cert)}
                        >
                          {downloadingId === cert.id ? (
                            <>
                              <Loader2 className="size-4 mr-2 animate-spin" />
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="size-4 mr-2" />
                              Download PDF
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          {pendingCerts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-12 text-center">
              <span className="inline-flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Trophy className="size-7" />
              </span>
              <div>
                <p className="font-medium">No completed courses yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Finish all lessons to earn a certificate
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {pendingCerts.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-[2px]"
                >
                  <Card className="border-0">
                    <CardContent className="p-5">
                      <Badge className="bg-emerald-100 text-emerald-700">
                        <Sparkles className="size-3" />
                        Course Complete!
                      </Badge>

                      <p className="mt-3 text-lg font-bold tracking-tight">
                        {enrollment.course?.title ?? "Course"}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {enrollment.batch
                          ? `Batch ${enrollment.batch.batchNumber}${
                              enrollment.batch.title
                                ? ` (${enrollment.batch.title})`
                                : ""
                            } · ${enrollment.progress}%`
                          : `${enrollment.progress}%`}
                      </p>

                      <p className="mt-3 text-sm text-muted-foreground">
                        Your certificate is ready!
                      </p>

                      <Button
                        className="mt-4 w-full"
                        onClick={() => handleGenerate(enrollment)}
                        disabled={loadingId === enrollment.id}
                      >
                        {loadingId === enrollment.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Award className="size-4" />
                        )}
                        Generate Certificate
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="waiting" className="mt-4">
          {waitingCerts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-12 text-center">
              <span className="inline-flex size-14 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <Hourglass className="size-7" />
              </span>
              <div>
                <p className="font-medium">Nothing waiting</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Completed batch courses waiting for the instructor to unlock
                  will appear here
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {waitingCerts.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="rounded-xl border border-amber-200 bg-amber-50 p-5"
                >
                  <Badge className="bg-amber-100 text-amber-700">
                    <Hourglass className="size-3" />
                    Waiting for Instructor
                  </Badge>

                  <p className="mt-3 text-lg font-bold tracking-tight">
                    {enrollment.course?.title ?? "Course"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {enrollment.batch
                      ? `Batch ${enrollment.batch.batchNumber}${
                          enrollment.batch.title
                            ? ` (${enrollment.batch.title})`
                            : ""
                        }`
                      : ""}
                  </p>

                  <p className="mt-3 flex items-center gap-2 text-sm font-medium text-emerald-700">
                    <CheckCircle2 className="size-4" />
                    You&apos;ve completed 100% of the course
                  </p>

                  <p className="mt-3 text-sm text-muted-foreground">
                    Your instructor hasn&apos;t finalized this batch yet.
                    You&apos;ll be notified when it&apos;s ready.
                  </p>

                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 w-full"
                    nativeButton={false}
                    render={<Link href="/learner/courses" />}
                  >
                    <BookOpen className="size-4" />
                    View Course
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <p className="text-center text-xs text-muted-foreground">
        <Link href="/learner/courses" className="hover:underline">
          Go to My Courses
        </Link>{" "}
        to continue learning.
      </p>

      <CertificateViewDialog
        open={Boolean(selectedCert)}
        onOpenChange={(open) => {
          if (!open) setSelectedCert(null);
        }}
        certificate={selectedCert}
      />
    </div>
  );
}
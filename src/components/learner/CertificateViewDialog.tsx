"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Download, GraduationCap, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import type { Certificate } from "@/types";
import { downloadCertificatePDF } from "@/utils/certificate-pdf";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
} from "@/components/ui/dialog";

export function CertificateViewDialog({
  open,
  onOpenChange,
  certificate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificate: Certificate | null;
}) {
  const [downloading, setDownloading] = useState(false);

  if (!certificate) return null;

  const issuedDate = certificate.issuedAt
    ? new Date(certificate.issuedAt)
    : null;

  const handleDownload = async () => {
    if (!certificate) return;
    setDownloading(true);
    try {
      await downloadCertificatePDF({
        learnerName: certificate.learnerName,
        courseName: certificate.courseName,
        batchName: certificate.batchName,
        certificateCode: certificate.certificateCode,
        issuedAt: certificate.issuedAt,
      });
      toast.success("Certificate downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to download");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-4xl overflow-hidden p-0"
      >
        <div className="no-print flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Certificate</h2>
            <DialogDescription className="mt-0.5 text-sm text-muted-foreground">
              View and download your certificate
            </DialogDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="bg-amber-50 p-6 sm:p-10">
          <div className="certificate-printable rounded-lg border-4 border-amber-200 bg-amber-50 p-2 text-center sm:p-2.5">
            <div className="rounded-md border-2 border-amber-200 px-6 py-8 sm:px-12 sm:py-12">
              <div className="mx-auto inline-flex size-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <GraduationCap className="size-8" />
              </div>

              <h3 className="mt-6 font-serif text-2xl font-bold tracking-wide text-amber-700 sm:text-3xl">
                CERTIFICATE OF COMPLETION
              </h3>
              <div className="mx-auto mt-3 h-1 w-24 bg-amber-300" />

              <p className="mt-8 text-sm text-muted-foreground">
                This is proudly presented to
              </p>

              <p className="mt-3 text-2xl font-bold tracking-wide text-slate-900 sm:text-3xl">
                {certificate.learnerName}
              </p>
              <div className="mx-auto mt-2 h-0.5 w-48 bg-slate-700" />

              <p className="mt-6 text-sm text-muted-foreground">
                For successfully completing the course
              </p>

              <p className="mt-3 text-xl font-bold italic text-slate-900 sm:text-2xl">
                {certificate.courseName}
              </p>

              {certificate.batchName ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {certificate.batchName}
                </p>
              ) : null}

              <div className="mt-8 space-y-1 text-sm text-muted-foreground">
                <p>
                  Issued on:{" "}
                  {issuedDate && !Number.isNaN(issuedDate.getTime())
                    ? format(issuedDate, "MMMM d, yyyy")
                    : certificate.issuedAt}
                </p>
                <p className="font-mono text-xs">
                  Certificate Code: {certificate.certificateCode}
                </p>
              </div>

              <div className="mt-10 flex items-center justify-center gap-8 text-xs text-muted-foreground">
                <div className="flex-1 border-t border-slate-300 pt-2 text-center">
                  Instructor
                </div>
                <div className="flex-1 border-t border-slate-300 pt-2 text-center">
                  Platform
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="no-print flex items-center justify-end gap-2 border-t px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={handleDownload}
            disabled={downloading}
            className="no-print"
          >
            {downloading ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <Download className="size-4 mr-2" />
            )}
            {downloading ? "Downloading..." : "Download PDF"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
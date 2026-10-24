import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Providers } from "@/lib/providers";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://lms-platform.vercel.app"
  ),
  title: {
    default: "LMS Platform — Learn English with Live Batches & Courses",
    template: "%s | LMS Platform",
  },
  description:
    "Learn English with expert teachers through self-paced courses and live batches. Track your progress, submit assignments, join support sessions and earn verifiable certificates.",
  openGraph: {
    type: "website",
    siteName: "LMS Platform",
    title: "LMS Platform — Learn English with Live Batches & Courses",
    description:
      "Self-paced English courses and live batches with expert teachers, assignments, support sessions and verifiable certificates.",
  },
  twitter: {
    card: "summary_large_image",
    title: "LMS Platform — Learn English with Live Batches & Courses",
    description:
      "Self-paced English courses and live batches with expert teachers.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}

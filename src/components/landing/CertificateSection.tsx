import Link from "next/link";
import { ArrowRight, BadgeCheck, Download, ShieldCheck, Sparkles } from "lucide-react";

const BENEFITS = [
  {
    icon: BadgeCheck,
    title: "Unlocks automatically",
    description: "Hit 100% course progress and your certificate is issued instantly.",
  },
  {
    icon: ShieldCheck,
    title: "Publicly verifiable",
    description:
      "Every certificate carries a unique code anyone can check on the Verify page — no login needed.",
  },
  {
    icon: Download,
    title: "Download & share",
    description:
      "Save it as a PDF and add it straight to your CV, LinkedIn, or portfolio.",
  },
];

export function CertificateSection() {
  return (
    <section className="bg-slate-50 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
              🎓 Verified Certificates
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">
              Your achievement,{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                officially proven
              </span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 md:text-base">
              Finish a course and you do not just get a PDF — you get a
              tamper-proof credential with a verification code that employers
              and peers can confirm in seconds.
            </p>

            <ul className="mt-8 space-y-5">
              {BENEFITS.map(({ icon: Icon, title, description }) => (
                <li key={title} className="flex gap-4">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <p className="font-bold text-slate-900">{title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-slate-600">
                      {description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <Link
              href="/courses"
              className="mt-9 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800"
            >
              Start earning certificates
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div
              aria-hidden="true"
              className="absolute -top-8 -left-8 size-40 rounded-full bg-indigo-200/40 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="absolute -right-6 -bottom-8 size-44 rounded-full bg-purple-200/40 blur-3xl"
            />

            <div className="relative rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-purple-700 p-2 shadow-2xl shadow-indigo-600/25">
              <div className="rounded-[1.25rem] border border-white/70 bg-white px-6 py-8 text-center sm:px-9 sm:py-10">
                <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-bold tracking-widest text-indigo-600 uppercase">
                  <Sparkles className="size-3" />
                  LMS Platform
                </span>

                <h3 className="mt-4 font-serif text-2xl font-bold tracking-wide text-slate-900 sm:text-3xl">
                  Certificate of Completion
                </h3>
                <p className="mt-3 text-xs text-slate-500">
                  This certificate is proudly presented to
                </p>
                <p className="mt-2 border-b border-dashed border-slate-300 pb-1 text-lg font-bold text-slate-800">
                  Your Name Here
                </p>
                <p className="mt-3 text-xs text-slate-500">
                  for successfully completing
                </p>
                <p className="mt-1 text-sm font-semibold text-indigo-600">
                  Spoken English — Complete Course
                </p>

                <div className="mt-7 flex items-end justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800">
                      Lead Instructor
                    </p>
                    <p className="mt-1 border-t border-slate-300 pt-1 text-[10px] tracking-wider text-slate-400 uppercase">
                      Signature
                    </p>
                  </div>

                  <span className="flex size-16 shrink-0 flex-col items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
                    <BadgeCheck className="size-6" />
                    <span className="text-[8px] font-bold tracking-widest">
                      VERIFIED
                    </span>
                  </span>

                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800">
                      Platform Director
                    </p>
                    <p className="mt-1 border-t border-slate-300 pt-1 text-[10px] tracking-wider text-slate-400 uppercase">
                      Signature
                    </p>
                  </div>
                </div>

                <p className="mt-6 text-[10px] tracking-wider text-slate-400 uppercase">
                  Verify at /verify/AB12CD
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

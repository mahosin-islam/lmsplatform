import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Phone, MessageCircle, MapPin, Send } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with our team. We&apos;re here to help with course enrollment, payments, or any questions you may have.",
};

const contactInfo = [
  {
    icon: Phone,
    title: "Phone",
    details: "+880 1777 308 777",
    href: "tel:+8801777308777",
  },
  {
    icon: Mail,
    title: "Email",
    details: "support@lmsplatform.com",
    href: "mailto:support@lmsplatform.com",
  },
  {
    icon: MessageCircle,
    title: "Live Chat",
    details: "Chat with our support team",
    href: "#",
  },
  {
    icon: MapPin,
    title: "Location",
    details: "Dhaka, Bangladesh",
    href: null,
  },
];

export default function ContactPage() {
  return (
    <>
      <section className="section-y">
        <div className="page-container">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-teal">
              Contact Us
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              Get in Touch
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Have questions about courses, enrollment, or payments? We&apos;re here
              to help. Reach out and we&apos;ll get back to you as soon as possible.
            </p>
          </div>
        </div>
      </section>

      <section className="section-y">
        <div className="page-container">
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Contact Information
              </h2>
              <p className="mt-2 text-muted-foreground">
                Choose your preferred way to reach us
              </p>
              <div className="mt-6 space-y-4">
                {contactInfo.map((item) => (
                  <div
                    key={item.title}
                    className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
                  >
                    <div className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <item.icon className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-card-foreground">
                        {item.title}
                      </h3>
                      {item.href ? (
                        <Link
                          href={item.href}
                          className="mt-1 text-sm text-muted-foreground transition-colors hover:text-primary"
                        >
                          {item.details}
                        </Link>
                      ) : (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {item.details}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
                <h2 className="text-xl font-bold tracking-tight text-card-foreground sm:text-2xl">
                  Send us a Message
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Fill out the form below and we&apos;ll get back to you shortly
                </p>
                <form className="mt-6 space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-card-foreground">
                        Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter your name"
                        className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-card-foreground">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="Enter your email"
                        className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-card-foreground">
                      Subject
                    </label>
                    <input
                      type="text"
                      placeholder="How can we help you?"
                      className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-card-foreground">
                      Message
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Write your message here..."
                      className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    <Send className="size-4" />
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-y">
        <div className="page-container">
          <div className="rounded-3xl border border-border bg-card px-6 py-10 text-center shadow-sm sm:px-10">
            <h2 className="text-2xl font-bold tracking-tight text-card-foreground sm:text-3xl">
              Need Immediate Assistance?
            </h2>
            <p className="mt-2 text-muted-foreground">
              Check our FAQ section for quick answers to common questions
            </p>
            <div className="mt-6">
              <Link
                href="/#faq"
                className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                View FAQs
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// GCC IV Therapy Arabic Landing Page Layout
// Standalone layout — no next-intl, Arabic-only, RTL

import type { ReactNode } from "react";
import { Cairo, Arapey } from "next/font/google";
import {
  GoogleTagManagerScript,
  GoogleTagManagerNoScript,
} from "@/components/analytics/GoogleTagManager";
import { GTMProvider } from "@/components/analytics/GTMProvider";
import { StickyMobileCTA } from "@/components/layout/StickyMobileCTA";
import { FloatingWhatsAppCTA } from "@/components/layout/FloatingWhatsAppCTA";
import { GccFloatingHomeButton } from "@/components/gcc/GccFloatingHomeButton";
import type { Metadata } from "next";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

const arapey = Arapey({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-arapey",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "IV Therapy in Cairo | Premier Health Clinics | علاج IV في القاهرة",
  description:
    "عناية طبية فاخرة أثناء إقامتك في القاهرة. جلسات IV Therapy مع إشراف طبي متكامل في 3 فروع مميزة. فيرمونت نايل سيتي، أركان بلازا، EDNC سوديك. احجز الآن.",
  keywords: [
    "IV Therapy Cairo",
    "IV درب القاهرة",
    "علاج وريدي القاهرة",
    "Premier Health Clinics",
    "GCC visitors Cairo",
    "زوار الخليج القاهرة",
    "IV Therapy Egypt",
    "علاج مميز القاهرة",
  ],
  alternates: {
    canonical: "https://www.premierhealthclinics.com/gcc/iv-therapy/ar",
  },
  openGraph: {
    title: "IV Therapy في القاهرة | Premier Health Clinics",
    description:
      "عناية طبية فاخرة أثناء إقامتك في القاهرة. جلسات IV Therapy بإشراف طبي متخصص.",
    url: "https://www.premierhealthclinics.com/gcc/iv-therapy/ar",
    siteName: "Premier Health Clinics",
    locale: "ar",
    type: "website",
    images: [
      {
        url: "https://res.cloudinary.com/dkbmez0sm/image/upload/v1/premier-health/og-gcc-iv.jpg",
        width: 1200,
        height: 630,
        alt: "IV Therapy Cairo — Premier Health Clinics",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "IV Therapy في القاهرة | Premier Health Clinics",
    description: "عناية طبية فاخرة أثناء إقامتك في القاهرة.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function GccLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} ${arapey.variable}`}
    >
      <head>
        <GoogleTagManagerScript />
        <link rel="icon" href="/logo/logo.webp" type="image/webp" sizes="any" />
        <link
          rel="preconnect"
          href="https://res.cloudinary.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className={`${cairo.className} bg-white min-h-screen antialiased selection:bg-amber-100`}
        style={{ direction: "rtl" }}
      >
        <GoogleTagManagerNoScript />
        {/* Attribution capture — no UI rendered */}
        <GTMProvider />
        {/* Floating Side Button to return to Homepage */}
        <GccFloatingHomeButton />
        {children}
        {/* Floating WhatsApp CTA */}
        <FloatingWhatsAppCTA />
        {/* Persistent Mobile Sticky CTA for WhatsApp, Call & Booking */}
        <StickyMobileCTA />
      </body>
    </html>
  );
}

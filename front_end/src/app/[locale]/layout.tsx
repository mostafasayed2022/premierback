import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";

import { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Arapey, Cairo, Plus_Jakarta_Sans } from "next/font/google";
import { PageLoader } from "@/components/layout/PageLoader";
import { Toaster } from "sonner";
import { PatientAuthProvider } from "@/context/PatientAuthContext";
import { Providers } from "@/app/providers";
import { getSeoMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/app/get-query-client";
import { getDepartments, getServices } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/queryKeys";

import {
  GoogleTagManagerScript,
  GoogleTagManagerNoScript,
} from "@/components/analytics/GoogleTagManager";
import { GTMProvider } from "@/components/analytics/GTMProvider";
import { StickyMobileCTA } from "@/components/layout/StickyMobileCTA";
import { FloatingWhatsAppCTA } from "@/components/layout/FloatingWhatsAppCTA";
import { BackToTop } from "@/components/common/BackToTop";

const arapey = Arapey({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-arapey",
  display: "swap",
  preload: false,
});

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans-default",
  display: "swap",
});

const fontArabic = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
  preload: false,
});

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return getSeoMetadata(locale);
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";

  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.departments.all,
      queryFn: getDepartments,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.services.all,
      queryFn: getServices,
    }),
  ]);

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${arapey.variable} ${fontSans.variable} ${fontArabic.variable} h-full antialiased scroll-smooth`}
    >
      <head>
        <GoogleTagManagerScript />
        <link rel="icon" href="/logo/logo.webp" type="image/webp" sizes="any" />
        <link rel="shortcut icon" href="/logo/logo.webp" type="image/webp" />
        <link rel="apple-touch-icon" href="/logo/logo.webp" />
        <link
          rel="preconnect"
          href="https://res.cloudinary.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://cdn.simpleicons.org" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.2.3/css/flag-icons.min.css"
        />
      </head>
      <body className="bg-white flex min-h-screen flex-col font-sans selection:bg-accent-light selection:text-primary">
        <GoogleTagManagerNoScript />
        <JsonLd locale={locale} />
        <Providers>
          <HydrationBoundary state={dehydrate(queryClient)}>
            <NextIntlClientProvider messages={messages} locale={locale}>
              <PatientAuthProvider>
                {/* Attribution capture — no UI, fires on every page load */}
                <GTMProvider />
                <PageLoader />
                <Toaster richColors position="top-center" />
                <div className="flex min-h-screen flex-col">
                  <Navbar />
                  <main className="flex-1 flex flex-col bg-white">
                    {children}
                  </main>
                  <Footer />
                </div>
                {/* Global floating WhatsApp button on all pages */}
                <FloatingWhatsAppCTA />
                {/* Global mobile sticky CTA — mounted once, hidden on desktop */}
                <StickyMobileCTA />
                {/* Global back-to-top — appears after 450px scroll */}
                <BackToTop />
              </PatientAuthProvider>
            </NextIntlClientProvider>
          </HydrationBoundary>
        </Providers>
      </body>
    </html>
  );
}

"use client";

// ─── StickyMobileCTA.tsx ──────────────────────────────────────────────────────
// Mobile-only fixed bottom CTA bar.
// Hidden on md+ screens (md:hidden).
// Three actions: WhatsApp | Call | Book
// All interactions tracked via analytics events.

import { MessageCircle, Phone, CalendarCheck } from "lucide-react";
import { CONTACT } from "@/lib/config/contact";
import {
  trackClickWhatsApp,
  trackClickCall,
  trackStartBooking,
} from "@/lib/analytics/events";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";

const LOCALES = ["en", "ar", "fr", "de", "es", "it", "tr", "ru"] as const;

export function StickyMobileCTA() {
  const pathname = usePathname();
  const t = useTranslations("Nav");

  // Extract the current locale from the URL path (e.g. /ar/services → "ar")
  const segments = pathname.split("/").filter(Boolean);
  const localeSegment = segments[0] as string;
  const currentLocale = (LOCALES as readonly string[]).includes(localeSegment)
    ? localeSegment
    : "en";
  const bookHref = `/${currentLocale}/book-appointment`;

  const handleWhatsApp = () => {
    trackClickWhatsApp({
      location: pathname,
      page_path: pathname,
      cta_position: "sticky_mobile",
      phone_type: "EG",
    });
  };

  const handleCall = () => {
    trackClickCall({
      location: pathname,
      page_path: pathname,
      cta_position: "sticky_mobile",
      phone_type: "EG",
    });
  };

  const handleBook = () => {
    trackStartBooking({
      booking_source: "sticky_mobile",
    });
  };

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      role="navigation"
      aria-label="Quick actions"
    >
      {/* WhatsApp */}
      <a
        href={`${CONTACT.whatsapp_url_eg}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleWhatsApp}
        aria-label="Chat on WhatsApp"
        className="flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[#25D366] hover:bg-green-50 active:bg-green-100 transition-colors min-h-[56px] touch-manipulation"
      >
        <MessageCircle size={20} strokeWidth={2} />
        <span className="text-[9px] font-bold uppercase tracking-widest leading-none">
          {t("whatsapp")}
        </span>
      </a>

      {/* Divider */}
      <div className="w-px bg-slate-100 my-2" aria-hidden="true" />

      {/* Call */}
      <a
        href={CONTACT.tel_eg}
        onClick={handleCall}
        aria-label="Call us"
        className="flex flex-1 flex-col items-center justify-center gap-1 py-3 text-primary hover:bg-blue-50 active:bg-blue-100 transition-colors min-h-[56px] touch-manipulation"
      >
        <Phone size={20} strokeWidth={2} />
        <span className="text-[9px] font-bold uppercase tracking-widest leading-none">
          {t("call")}
        </span>
      </a>

      {/* Divider */}
      <div className="w-px bg-slate-100 my-2" aria-hidden="true" />

      {/* Book */}
      <Link
        href={bookHref}
        onClick={handleBook}
        aria-label="Book appointment"
        className="flex flex-1 flex-col items-center justify-center gap-1 py-3 bg-accent text-white hover:bg-accent/90 active:bg-accent/80 transition-colors min-h-[56px] touch-manipulation"
      >
        <CalendarCheck size={20} strokeWidth={2} />
        <span className="text-[9px] font-bold uppercase tracking-widest leading-none">
          {t("book")}
        </span>
      </Link>
    </div>
  );
}

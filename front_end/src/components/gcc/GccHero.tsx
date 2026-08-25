"use client";

// ─── GccHero.tsx ──────────────────────────────────────────────────────────────
// Arabic-first hero section for GCC visitors with luxury layout3 background
// Tracking: start_booking, click_whatsapp, click_call

import Image from "next/image";
import { MessageCircle, Phone, CalendarCheck, Star } from "lucide-react";
import { CONTACT } from "@/lib/config/contact";
import {
  trackClickWhatsApp,
  trackClickCall,
  trackStartBooking,
} from "@/lib/analytics/events";
import Link from "next/link";

const PAGE_PATH = "/gcc/iv-therapy/ar";

export function GccHero() {
  return (
    <section className="relative min-h-[92vh] flex flex-col items-center justify-center overflow-hidden bg-[#0d2235] text-white py-16">
      {/* Background Image: layout3.webp */}
      <Image
        src="/AboutPreview/layout3.webp"
        alt="Premier Health Luxury Sanctuary"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center z-0 scale-105"
      />

      {/* Dark Luxury Gradient Overlay to ensure maximum contrast & readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0d2235]/90 via-[#0d2235]/80 to-[#0d2235] z-5 pointer-events-none" />

      {/* Background decorative glow elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-300/5 rounded-full blur-3xl" />
      </div>

      {/* Trust badge */}
      <div className="relative z-10 mb-6 flex items-center gap-2 bg-black/40 backdrop-blur-md border border-amber-400/30 rounded-full px-4 py-2 shadow-lg">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
          ))}
        </div>
        <span className="text-xs font-bold text-white/95">
          رعاية طبية فاخرة · القاهرة
        </span>
      </div>

      {/* Main headline */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-4 text-white drop-shadow-md">
          عناية طبية فاخرة
          <br />
          <span className="text-amber-400">أثناء إقامتك في القاهرة</span>
        </h1>

        <p className="text-base sm:text-xl text-white/90 mb-4 leading-relaxed max-w-2xl mx-auto drop-shadow-sm">
          جلسات <strong className="text-amber-300">IV Therapy</strong> احترافية
          مع إشراف طبي متخصص في 3 مواقع مميزة
        </p>

        {/* Value props */}
        <div className="flex flex-wrap justify-center gap-2.5 mb-10 text-xs sm:text-sm text-white/90">
          {[
            "تقييم طبي شامل",
            "بيئة طبية خاصة وراقية",
            "3 فروع في أفضل مواقع القاهرة",
            "Concierge متخصص للزوار",
          ].map((item) => (
            <span
              key={item}
              className="flex items-center gap-1.5 bg-black/30 backdrop-blur-sm border border-white/15 rounded-full px-3 py-1.5 shadow-sm"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
              {item}
            </span>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3.5 justify-center items-center">
          {/* Primary: Book */}
          <Link
            href="/ar/book-appointment"
            onClick={() =>
              trackStartBooking({
                booking_source: "gcc_hero",
                service_name: "IV Therapy",
              })
            }
            className="flex items-center gap-2.5 bg-amber-400 hover:bg-amber-500 text-[#0d2235] font-bold px-8 py-4 rounded-2xl transition-all duration-300 shadow-xl shadow-amber-400/30 hover:shadow-amber-400/50 hover:-translate-y-0.5 text-base w-full sm:w-auto justify-center"
          >
            <CalendarCheck size={20} />
            <span>احجز الآن</span>
          </Link>

          {/* Secondary: WhatsApp */}
          <a
            href={`${CONTACT.whatsapp_url_eg}?text=${encodeURIComponent(
              "مرحباً، أود الاستفسار عن جلسات IV Therapy [Ref: gcc_iv_google]"
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackClickWhatsApp({
                location: PAGE_PATH,
                page_path: PAGE_PATH,
                service_name: "IV Therapy",
                cta_position: "gcc_hero",
                phone_type: "EG",
              })
            }
            className="flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold px-8 py-4 rounded-2xl transition-all duration-300 shadow-xl shadow-green-500/30 hover:-translate-y-0.5 text-base w-full sm:w-auto justify-center"
          >
            <MessageCircle size={20} />
            <span>تواصل مع Concierge عبر واتساب</span>
          </a>

          {/* Tertiary: Call */}
          <a
            href={CONTACT.tel_eg}
            onClick={() =>
              trackClickCall({
                location: PAGE_PATH,
                page_path: PAGE_PATH,
                service_name: "IV Therapy",
                cta_position: "gcc_hero",
                phone_type: "EG",
              })
            }
            className="flex items-center gap-2.5 bg-white/10 hover:bg-white/20 text-white font-bold px-7 py-4 rounded-2xl transition-all duration-300 border border-white/20 hover:-translate-y-0.5 text-base w-full sm:w-auto justify-center backdrop-blur-sm"
          >
            <Phone size={20} className="text-amber-400" />
            <span>اتصل بنا</span>
          </a>
        </div>
      </div>
    </section>
  );
}

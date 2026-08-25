"use client";

// ─── GccFinalCTA.tsx ──────────────────────────────────────────────────────────
// Final conversion section — book, WhatsApp, or call
// All actions tracked

import { CalendarCheck, MessageCircle, Phone } from "lucide-react";
import { CONTACT } from "@/lib/config/contact";
import {
  trackClickWhatsApp,
  trackClickCall,
  trackStartBooking,
} from "@/lib/analytics/events";
import Link from "next/link";

const PAGE_PATH = "/gcc/iv-therapy/ar";

export function GccFinalCTA() {
  return (
    <section className="py-20 bg-gradient-to-br from-[#0d2235] via-[#1a3a50] to-[#0d2235] text-white text-center overflow-hidden relative">
      {/* Background accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-4">
        <p className="text-amber-400 font-bold text-sm uppercase tracking-widest mb-4">
          ابدأ الآن
        </p>
        <h2 className="text-3xl sm:text-5xl font-bold mb-4">
          احجز جلستك اليوم
        </h2>
        <p className="text-white/70 text-base mb-10 max-w-xl mx-auto leading-relaxed">
          سواء كنت في القاهرة الآن أو تخطط لزيارة قريبة، فريقنا جاهز لمساعدتك
          في الحجز والإجابة على كل استفساراتك.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {/* Primary: Book */}
          <Link
            href="/ar/book-appointment"
            onClick={() =>
              trackStartBooking({
                service_name: "IV Therapy",
                booking_source: "gcc_final_cta",
              })
            }
            className="flex items-center gap-2.5 bg-amber-400 hover:bg-amber-500 text-[#0d2235] font-bold px-8 py-4 rounded-2xl transition-all duration-300 shadow-lg shadow-amber-400/30 hover:-translate-y-0.5 text-base w-full sm:w-auto justify-center"
          >
            <CalendarCheck size={20} />
            احجز الآن
          </Link>

          {/* WhatsApp */}
          <a
            href={`${CONTACT.whatsapp_url_eg}?text=${encodeURIComponent("مرحباً، أود الحجز لجلسة IV Therapy [Ref: gcc_iv_final]")}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackClickWhatsApp({
                location: PAGE_PATH,
                page_path: PAGE_PATH,
                service_name: "IV Therapy",
                cta_position: "gcc_final_cta",
                phone_type: "EG",
              })
            }
            className="flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold px-8 py-4 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 text-base w-full sm:w-auto justify-center"
          >
            <MessageCircle size={20} />
            واتساب
          </a>

          {/* Call UAE */}
          <a
            href={CONTACT.tel_uae}
            onClick={() =>
              trackClickCall({
                location: PAGE_PATH,
                page_path: PAGE_PATH,
                service_name: "IV Therapy",
                cta_position: "gcc_final_cta",
                phone_type: "UAE",
              })
            }
            className="flex items-center gap-2.5 bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-4 rounded-2xl transition-all duration-300 border border-white/20 hover:-translate-y-0.5 text-base w-full sm:w-auto justify-center"
          >
            <Phone size={20} />
            {CONTACT.phone_uae}
          </a>
        </div>

        {/* Contact email */}
        <p className="mt-8 text-white/40 text-xs">
          أو راسلنا على{" "}
          <a
            href={`mailto:${CONTACT.email_info}`}
            className="text-amber-400/70 hover:text-amber-400 transition-colors underline"
          >
            {CONTACT.email_info}
          </a>
        </p>
      </div>
    </section>
  );
}

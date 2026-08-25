"use client";

// ─── IVBookingCTA.tsx ────────────────────────────────────────────────────────
// High-conversion luxury concierge banner for IV Therapy booking.

import { useTranslations } from "next-intl";
import { MessageCircle, Phone, Sparkles, MapPin } from "lucide-react";
import { CONTACT } from "@/lib/config/contact";
import { trackClickWhatsApp, trackClickCall } from "@/lib/analytics/events";
import { usePathname } from "next/navigation";

export function IVBookingCTA() {
  const t = useTranslations("IVPackages");
  const pathname = usePathname();

  const handleWhatsApp = () => {
    trackClickWhatsApp({
      location: pathname,
      page_path: pathname,
      service_name: "IV Therapy Concierge",
      cta_position: "packages_bottom_cta",
      phone_type: "EG",
    });
  };

  const handleCall = () => {
    trackClickCall({
      location: pathname,
      page_path: pathname,
      service_name: "IV Therapy Concierge",
      cta_position: "packages_bottom_cta",
      phone_type: "EG",
    });
  };

  const encodedMsg = encodeURIComponent(t("heroMsg"));

  return (
    <section className="py-20 lg:py-28 bg-[#0D2235] text-white relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#C8A96B]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Concierge Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-[#C8A96B]/40 text-[#C8A96B] text-xs sm:text-sm font-bold mb-6">
          <Sparkles className="w-4 h-4 text-[#C8A96B]" />
          <span>{t("conciergeBadge")}</span>
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-black tracking-tight leading-tight text-white mb-5 max-w-3xl mx-auto">
          {t("conciergeTitle")}
        </h2>

        {/* Subtitle */}
        <p className="text-sm sm:text-lg text-white/85 max-w-2xl mx-auto leading-relaxed mb-10">
          {t("conciergeSubtitle")}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-12">
          {/* Primary: WhatsApp */}
          <a
            href={`${CONTACT.whatsapp_url_eg}?text=${encodedMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWhatsApp}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-base sm:text-lg px-9 py-4 rounded-2xl shadow-xl shadow-green-500/25 hover:shadow-green-500/40 hover:-translate-y-0.5 transition-all duration-300"
          >
            <MessageCircle className="w-5 h-5 fill-current" />
            <span>{t("heroCta")}</span>
          </a>

          {/* Secondary: Direct Call */}
          <a
            href="tel:+201200644663"
            onClick={handleCall}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 text-white font-bold text-base sm:text-lg px-8 py-4 rounded-2xl border border-white/20 hover:-translate-y-0.5 transition-all duration-300 backdrop-blur-sm"
          >
            <Phone className="w-5 h-5 text-[#C8A96B]" />
            <span dir="ltr">+20 11 11977705</span>
          </a>
        </div>

        {/* Branch Tags */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm text-white/70">
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3.5 py-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#C8A96B]" />
            <span>Fairmont Nile City</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3.5 py-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#C8A96B]" />
            <span>Arkan Plaza (Sheikh Zayed)</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3.5 py-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#C8A96B]" />
            <span>EDNC Sodic (New Cairo)</span>
          </div>
        </div>
      </div>
    </section>
  );
}

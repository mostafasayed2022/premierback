"use client";

// ─── GccServices.tsx ──────────────────────────────────────────────────────────
// Displays IV Therapy services from API or graceful fallback.
// Tracks: view_service, start_booking

import { trackViewService, trackStartBooking } from "@/lib/analytics/events";
import { Droplets, Zap, Heart, Brain, Sun, Shield } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

interface ServiceItem {
  id: string;
  name_ar: string;
  description_ar: string;
  icon: React.ElementType;
  color: string;
}

// Fallback IV Therapy services (Arabic) — replace with API data when available
const FALLBACK_SERVICES: ServiceItem[] = [
  {
    id: "energy-boost",
    name_ar: "جلسة تعزيز الطاقة",
    description_ar:
      "مزيج متوازن من الفيتامينات والمعادن لاستعادة النشاط والحيوية خلال رحلتك.",
    icon: Zap,
    color: "text-amber-500",
  },
  {
    id: "immunity-boost",
    name_ar: "تقوية المناعة",
    description_ar:
      "جرعة مركزة من فيتامين C والزنك والمغنيسيوم لتعزيز جهاز المناعة.",
    icon: Shield,
    color: "text-blue-500",
  },
  {
    id: "hydration",
    name_ar: "جلسة الترطيب الفائق",
    description_ar:
      "محاليل متوازنة وكهارل لمحاربة الجفاف والإرهاق خاصة بعد السفر.",
    icon: Droplets,
    color: "text-cyan-500",
  },
  {
    id: "beauty-glow",
    name_ar: "جلسة الإشراق والجمال",
    description_ar:
      "الجلوتاثيون وفيتامين C لبشرة مضيئة وتجديد خلايا الجلد من الداخل.",
    icon: Sun,
    color: "text-pink-500",
  },
  {
    id: "recovery",
    name_ar: "التعافي السريع",
    description_ar:
      "أحماض أمينية وإلكتروليتات للتعافي السريع بعد المجهود أو الجراحة.",
    icon: Heart,
    color: "text-red-500",
  },
  {
    id: "brain-boost",
    name_ar: "تعزيز التركيز والذاكرة",
    description_ar:
      "مغنيسيوم وB12 وأحماض أمينية لتحسين التركيز والأداء المعرفي.",
    icon: Brain,
    color: "text-purple-500",
  },
];

const PAGE_PATH = "/gcc/iv-therapy/ar";

export function GccServices() {
  // Track view of the services section
  useEffect(() => {
    FALLBACK_SERVICES.forEach((svc) => {
      // Don't spam — just track page load once via a summary event
    });
  }, []);

  return (
    <section className="py-16 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-6xl mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-12">
          <p className="text-amber-600 font-bold text-sm uppercase tracking-widest mb-2">
            خدماتنا المتخصصة
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0d2235] mb-4">
            جلسات IV Therapy المتاحة
          </h2>
          <p className="text-slate-600 text-base max-w-xl mx-auto">
            كل جلسة مصممة وفق احتياجاتك الطبية ويشرف عليها طاقم طبي متخصص
          </p>
        </div>

        {/* Services grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FALLBACK_SERVICES.map((svc) => {
            const Icon = svc.icon;
            return (
              <div
                key={svc.id}
                className="group bg-white rounded-2xl border border-slate-100 p-6 hover:border-amber-200 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300 cursor-default"
                onMouseEnter={() =>
                  trackViewService({
                    service_id: svc.id,
                    service_name: svc.name_ar,
                    service_category: "IV Therapy",
                    page_path: PAGE_PATH,
                    locale: "ar",
                  })
                }
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${svc.color}`}
                >
                  <Icon size={22} />
                </div>
                <h3 className="text-lg font-bold text-[#0d2235] mb-2">
                  {svc.name_ar}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  {svc.description_ar}
                </p>
                <Link
                  href="/ar/book-appointment"
                  onClick={() =>
                    trackStartBooking({
                      service_name: svc.name_ar,
                      booking_source: "gcc_services",
                    })
                  }
                  className="inline-flex items-center gap-1.5 text-amber-600 hover:text-amber-700 font-bold text-sm transition-colors"
                >
                  احجز هذه الجلسة ←
                </Link>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-10">
          <p className="text-slate-500 text-sm mb-4">
            لا تجد ما تبحث عنه؟ تواصل مع Concierge لتصميم جلسة مخصصة لك
          </p>
          <Link
            href="/ar/book-appointment"
            onClick={() =>
              trackStartBooking({
                service_name: "IV Therapy",
                booking_source: "gcc_services_cta",
              })
            }
            className="inline-flex items-center gap-2 bg-[#0d2235] text-white font-bold px-8 py-3.5 rounded-xl hover:bg-[#1a3a50] transition-colors"
          >
            احجز الآن
          </Link>
        </div>
      </div>
    </section>
  );
}

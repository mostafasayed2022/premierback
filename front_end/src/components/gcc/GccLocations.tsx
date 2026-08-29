"use client";

// ─── GccLocations.tsx ─────────────────────────────────────────────────────────
// Real Premier Health Branches for GCC Visitors
// Actual locations: Fairmont Nile City, Arkan Plaza (Sheikh Zayed), EDNC Sodic (New Cairo)

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  MapPin,
  Phone,
  MessageCircle,
  Navigation,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { CONTACT } from "@/lib/config/contact";
import {
  trackSelectBranch,
  trackClickMap,
  trackClickWhatsApp,
  trackClickCall,
} from "@/lib/analytics/events";
import { getBranches, Branch } from "@/lib/api";

const PAGE_PATH = "/gcc/iv-therapy/ar";

interface VerifiedBranch {
  id: string | number;
  name_ar: string;
  name_en: string;
  badge: string;
  badgeColor: string;
  address_ar: string;
  phone: string;
  image_url: string;
  map_url: string;
  highlight_ar: string;
  services_ar: string[];
}

const REAL_VERIFIED_BRANCHES: VerifiedBranch[] = [
  {
    id: 2,
    name_ar: "فيرمونت نايل سيتي",
    name_en: "Fairmont Nile City",
    badge: "قلب القاهرة · على النيل",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-400/30",
    address_ar: "فندق فيرمونت نايل سيتي، أبراج نايل سيتي، كورنيش النيل، القاهرة",
    phone: "+20 12 0064 4663",
    image_url:
      "https://res.cloudinary.com/u3q5mcfx/image/upload/v1/uploads/1/DSC04519_fyazrj.jpg",
    map_url:
      "https://www.google.com/maps/place/Premier+Health/@30.0719202,31.2275839,17z",
    highlight_ar:
      "موقع مركزي فاخر داخل فندق فيرمونت نايل سيتي، مناسب لزوار الفنادق الكبرى ووسط القاهرة.",
    services_ar: [
      "علاجات NAD+ لتجديد الخلايا",
      "جلسات الترطيب والطاقة والمناعة",
      "أجنحة علاجية خاصة بإطلالة نيلية",
    ],
  },
  {
    id: 4,
    name_ar: "أركان بلازا – الشيخ زايد",
    name_en: "Arkan Plaza – Sheikh Zayed",
    badge: "غرب القاهرة · الشيخ زايد",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
    address_ar: "مجمع أركان بلازا الطبي، مدخل الشيخ زايد، 6 أكتوبر",
    phone: "+20 12 0064 4663",
    image_url:
      "https://res.cloudinary.com/u3q5mcfx/image/upload/v1/uploads/1/hero1_qimiy7.jpg",
    map_url:
      "https://www.google.com/maps/place/Arkan+Plaza/@30.0194029,31.0045291,17z",
    highlight_ar:
      "في أرقى مجمعات الشيخ زايد، ملاذ صحي مجهز بأحدث تقنيات الحقن الوريدي والتجميل الطبي.",
    services_ar: [
      "بروتوكولات التعافي الرياضي والنشاط",
      "علاجات الجلوتاثيون والنضارة",
      "جلسات Hydrafacial الطبية المتقدمة",
    ],
  },
  {
    id: 3,
    name_ar: "EDNC سوديك – التجمع الخامس",
    name_en: "EDNC Sodic – New Cairo",
    badge: "شرق القاهرة · التجمع الخامس",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-400/30",
    address_ar: "مجمع EDNC التجاري، مشروع سوديك إيست تاون، التجمع الخامس، القاهرة الجديدة",
    phone: "+20 12 0064 4663",
    image_url:
      "https://res.cloudinary.com/u3q5mcfx/image/upload/v1/uploads/1/DSC04539_pxbhlp.jpg",
    map_url:
      "https://www.google.com/maps?q=30.0154326,31.5145233",
    highlight_ar:
      "عيادة متطورة في قلب القاهرة الجديدة بالقرب من الجامعة الأمريكية ومناطق التسوق الراقية.",
    services_ar: [
      "مغذيات الديتوكس ومكافحة الإجهاد",
      "بروتوكولات الـ Wellness الشاملة",
      "خدمة VIP وسرعة إنهاء الإجراءات",
    ],
  },
];

export function GccLocations() {
  const [branches, setBranches] = useState<VerifiedBranch[]>(REAL_VERIFIED_BRANCHES);

  useEffect(() => {
    // Merge real API data if available with rich curated metadata
    getBranches()
      .then((apiBranches) => {
        if (apiBranches && apiBranches.length > 0) {
          const merged = REAL_VERIFIED_BRANCHES.map((curated) => {
            const apiMatch = apiBranches.find(
              (b) =>
                String(b.id) === String(curated.id) ||
                b.name.toLowerCase().includes(curated.name_en.toLowerCase().split(" ")[0]),
            );
            if (!apiMatch) return curated;
              return {
                ...curated,
                image_url: apiMatch.image_url || curated.image_url,
                phone: curated.phone,
                address_ar: apiMatch.address_ar || apiMatch.address || curated.address_ar,
              };
          });
          setBranches(merged);
        }
      })
      .catch(() => {
        // Fallback to verified branches data
      });
  }, []);

  return (
    <section className="py-20 bg-[#0d2235] text-white relative overflow-hidden" id="gcc-branches">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles size={13} className="text-amber-400" />
            <span>فروعنا الحقيقية المعتمدة</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            3 فروع راقية في أرقى أحياء القاهرة
          </h2>
          <p className="text-white/70 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            اختر الفرع الأقرب إلى إقامتك أو تنقلاتك أثناء زيارتك للقاهرة، مع إمكانية التنسيق المسبق مع فريق الـ Concierge.
          </p>
        </div>

        {/* 3 Branches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {branches.map((loc) => (
            <div
              key={loc.id}
              onClick={() =>
                trackSelectBranch({
                  branch_id: loc.id,
                  branch_name: loc.name_ar,
                  page_path: PAGE_PATH,
                })
              }
              
              className="group bg-white/[0.04] border border-white/10 hover:border-amber-400/40 rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-black/40 flex flex-col justify-between"
            >
              <div>
                {/* Branch Cover Image */}
                <div className="relative h-52 w-full overflow-hidden bg-slate-900">
                  <Image
                    src={loc.image_url}
                    alt={loc.name_ar}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d2235] via-[#0d2235]/30 to-transparent" />

                  {/* Badge */}
                  <span
                    className={`absolute top-4 right-4 text-[11px] font-bold px-3 py-1 rounded-full border backdrop-blur-md ${loc.badgeColor}`}
                  >
                    {loc.badge}
                  </span>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="font-bold text-xl text-white mb-2 group-hover:text-amber-300 transition-colors">
                    {loc.name_ar}
                  </h3>

                  <div className="flex items-start gap-2 text-white/60 text-xs mb-4 leading-relaxed">
                    <MapPin size={15} className="text-amber-400 shrink-0 mt-0.5" />
                    <span>{loc.address_ar}</span>
                  </div>

                  <p className="text-white/80 text-xs sm:text-sm mb-5 leading-relaxed bg-white/[0.03] p-3 rounded-xl border border-white/5">
                    {loc.highlight_ar}
                  </p>

                  {/* Services Available */}
                  <div className="space-y-2 mb-6">
                    <span className="text-[11px] font-bold text-amber-400/90 block">
                      الخدمات المتوفرة بالفرع:
                    </span>
                    {loc.services_ar.map((svc, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-2 text-white/75 text-xs">
                        <CheckCircle2 size={13} className="text-amber-400 shrink-0" />
                        <span>{svc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 pt-0 space-y-2">
                {/* Google Maps Link */}
                <a
                  href={loc.map_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    trackClickMap({
                      branch_id: loc.id,
                      branch_name: loc.name_ar,
                      location: PAGE_PATH,
                      page_path: PAGE_PATH,
                    })
                  }
                  className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs py-2.5 px-4 rounded-xl border border-white/10 transition-colors"
                >
                  <Navigation size={14} className="text-amber-400" />
                  <span>الاتجاهات على خرائط Google</span>
                </a>

                <div className="grid grid-cols-2 gap-2">
                  {/* WhatsApp CTA */}
                  <a
                    href={`${CONTACT.whatsapp_url_eg}?text=${encodeURIComponent(
                      `مرحباً، أود حجز جلسة IV Therapy في فرع ${loc.name_ar} [Ref: gcc_branch_${loc.id}]`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      trackClickWhatsApp({
                        location: PAGE_PATH,
                        page_path: PAGE_PATH,
                        branch_name: loc.name_ar,
                        cta_position: "gcc_locations",
                        phone_type: "EG",
                      })
                    }
                    className="flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs py-2.5 px-3 rounded-xl transition-all shadow-md shadow-green-600/20"
                  >
                    <MessageCircle size={14} />
                    <span>واتساب</span>
                  </a>

                  {/* Direct Call CTA */}
                  <a
                    href={CONTACT.tel_eg}
                    onClick={() =>
                      trackClickCall({
                        location: PAGE_PATH,
                        page_path: PAGE_PATH,
                        branch_name: loc.name_ar,
                        cta_position: "gcc_locations",
                        phone_type: "EG",
                      })
                    }
                    className="flex items-center justify-center gap-1.5 bg-amber-400 hover:bg-amber-500 text-[#0d2235] font-bold text-xs py-2.5 px-3 rounded-xl transition-all shadow-md shadow-amber-400/20"
                  >
                    <Phone size={14} />
                    <span>اتصال</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

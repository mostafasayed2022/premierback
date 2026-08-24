"use client";

import React from "react";
import { Link } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Stethoscope } from "lucide-react";
import Image from "next/image";
import type { Department } from "@/lib/types";
import { useDoctors } from "@/lib/api";

interface BranchSpecialtiesSectionProps {
  departments: Department[];
  isLoading: boolean;
}

export function BranchSpecialtiesSection({
  departments,
  isLoading,
}: BranchSpecialtiesSectionProps) {
  const t = useTranslations("Branches");
  const locale = useLocale();
  const isAr = locale === "ar";
  const { data: allDoctors = [] } = useDoctors();

  const getDeptDoctorsCount = (dept: Department): number => {
    if (allDoctors && allDoctors.length > 0) {
      const slug = (dept.slug || "").toLowerCase().trim();
      const deptId = String(dept.id || "").trim();
      const deptName = (dept.name || "").toLowerCase().trim();
      const deptNameAr = (dept.name_ar || "").trim();

      const matching = allDoctors.filter((doc) => {
        const docDept = String(
          (doc as any).department ||
            (doc as any).department_slug ||
            (doc as any).department_id ||
            (doc as any).department_name ||
            "",
        ).toLowerCase().trim();

        if (
          docDept &&
          (docDept === slug ||
            docDept === deptId ||
            docDept === deptName ||
            (deptName && docDept.includes(deptName)) ||
            (slug && docDept.includes(slug)))
        ) {
          return true;
        }

        const sp = (
          (doc.specialty || "") +
          " " +
          (doc.position || "") +
          " " +
          (doc.bio || "")
        ).toLowerCase();
        const spAr =
          (doc.specialty_ar || "") +
          " " +
          (doc.position_ar || "") +
          " " +
          (doc.bio_ar || "");

        if (deptName && sp.includes(deptName)) return true;
        if (deptNameAr && spAr.includes(deptNameAr)) return true;

        if (slug === "iv-therapy" || slug === "iv_therapy" || slug.includes("iv")) {
          return (
            sp.includes("iv") ||
            sp.includes("wellness") ||
            sp.includes("nutrition") ||
            sp.includes("nad") ||
            sp.includes("drip") ||
            spAr.includes("وريد") ||
            spAr.includes("تغذية") ||
            spAr.includes("تقطير")
          );
        }
        if (slug === "dermatology" || slug.includes("derm")) {
          return (
            sp.includes("derm") ||
            sp.includes("skin") ||
            spAr.includes("جلد") ||
            spAr.includes("بشرة")
          );
        }
        if (slug === "aesthetics" || slug.includes("aesthetic")) {
          return (
            sp.includes("aesthetic") ||
            sp.includes("laser") ||
            sp.includes("cosmetic") ||
            sp.includes("filler") ||
            sp.includes("botox") ||
            sp.includes("derm") ||
            spAr.includes("تجميل") ||
            spAr.includes("ليزر") ||
            spAr.includes("فيلر") ||
            spAr.includes("بوتوكس") ||
            spAr.includes("جلد")
          );
        }
        if (
          slug === "body-contouring" ||
          slug === "body_contouring" ||
          slug.includes("body") ||
          slug.includes("contour")
        ) {
          return (
            sp.includes("body") ||
            sp.includes("sculpt") ||
            sp.includes("contour") ||
            sp.includes("slimming") ||
            spAr.includes("قوام") ||
            spAr.includes("نحت") ||
            spAr.includes("تنسيق")
          );
        }
        return false;
      });

      return matching.length;
    }

    return (dept as any).doctors_count ?? (dept as any).doctorsCount ?? 0;
  };

  const departmentSpecialties = departments.slice(0, 4);

  return (
    <section className="bg-slate-900 text-white py-20 relative overflow-hidden">
      {/* Ambient glow backgrounds */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#C8A96B]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#385366]/30 rounded-full blur-[140px] pointer-events-none" />

      <div className="luxury-container relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-[#C8A96B] font-bold text-xs tracking-widest uppercase flex items-center gap-1.5">
              <Sparkles size={13} className="text-[#C8A96B]" />
              {t("specialtiesSubtitle")}
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-white mt-2">
              {t("specialtiesTitle")}
            </h2>
          </div>
          <Link
            href="/departments"
            aria-label={isAr ? "عرض جميع التخصصات" : "View all specialties"}
            className="inline-flex items-center gap-2 text-sm font-bold text-[#C8A96B] hover:text-white transition-colors"
          >
            <span>{t("viewAllSpecialties")}</span>
            <ArrowRight size={16} className="rtl:rotate-180" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 h-72 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white/10 rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {departmentSpecialties.map((dept: Department, idx: number) => {
              const imageUrl =
                dept.image_url ||
                dept.photo ||
                "/Departments/iv_theapy.webp";

              return (
                <motion.div
                  key={dept.id}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="group relative rounded-3xl overflow-hidden bg-slate-800/80 border border-white/15 flex flex-col justify-between h-72 p-6 transition-transform duration-500 hover:-translate-y-1.5 hover:border-[#C8A96B]/50"
                >
                  <Image
                    src={imageUrl}
                    alt={isAr ? dept.name_ar : dept.name}
                    fill
                    className="object-cover opacity-40 group-hover:scale-105 group-hover:opacity-50 transition-all duration-700 pointer-events-none"
                    sizes="(max-width: 768px) 100vw, 25vw"
                  />

                  <div className="relative z-10 flex items-center justify-between">
                    <span className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-[#C8A96B]">
                      <Stethoscope size={18} />
                    </span>
                    {getDeptDoctorsCount(dept) > 0 && (
                      <span className="text-[10px] font-bold text-white/80 uppercase bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                        {getDeptDoctorsCount(dept)} {t("specialistsCount")}
                      </span>
                    )}
                  </div>

                  <div className="relative z-10">
                    <h3 className="font-serif text-xl font-bold text-white mb-1 group-hover:text-[#C8A96B] transition-colors">
                      {isAr ? dept.name_ar : dept.name}
                    </h3>
                    <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">
                      {isAr ? dept.description_ar : dept.description}
                    </p>
                    <Link
                      href={`/department/${dept.slug}`}
                      aria-label={`${isAr ? "اقرأ المزيد عن قسم" : "Learn more about"} ${isAr ? dept.name_ar : dept.name}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C8A96B] mt-3 hover:underline"
                    >
                      <span>{t("learnMore")}</span>
                      <ArrowRight size={12} className="rtl:rotate-180" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

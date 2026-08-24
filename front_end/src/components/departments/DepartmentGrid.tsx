"use client";

import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Link } from "@/i18n/routing";
import { ArrowRight, Users, Loader2 } from "lucide-react";
import { useDepartments, useDoctors, Department } from "@/lib/api";
import { getOptimizedImageUrl } from "@/lib/utils/image";
import Image from "next/image";

export function DepartmentGrid() {
  const t = useTranslations();
  const locale = useLocale();
  const { data: departments, isLoading } = useDepartments();
  const { data: allDoctors = [] } = useDoctors();

  const getDeptDoctorsCount = (dept: Department): number => {
    if (allDoctors && allDoctors.length > 0) {
      const slug = (dept.slug || "").toLowerCase().trim();
      const deptId = String(dept.id || "").trim();
      const deptName = (dept.name || "").toLowerCase().trim();
      const deptNameAr = (dept.name_ar || "").trim();

      const matching = allDoctors.filter((doc) => {
        // 1. Direct department ID / Slug / Name matching
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

        // 2. Specialty & title keywords matching
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

  const formatDoctorsCount = (c: number) => {
    if (locale === "ar") {
      if (c === 1) return "1 طبيب";
      if (c === 2) return "2 أطباء";
      return `${c} أطباء`;
    }
    if (locale === "de") {
      return c === 1 ? "1 Arzt" : `${c} Ärzte`;
    }
    if (locale === "fr") {
      return c === 1 ? "1 Médecin" : `${c} Médecins`;
    }
    if (locale === "it") {
      return c === 1 ? "1 Medico" : `${c} Medici`;
    }
    if (locale === "es") {
      return c === 1 ? "1 Médico" : `${c} Médicos`;
    }
    if (locale === "ru") {
      return c === 1 ? "1 врач" : `${c} врачей`;
    }
    if (locale === "tr") {
      return `${c} Doktor`;
    }
    return c === 1 ? "1 Doctor" : `${c} Doctors`;
  };

  if (isLoading) {
    return (
      <section className="luxury-container py-16">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-80 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-3xl"
            />
          ))}
        </div>
      </section>
    );
  }

  const list = departments || [];

  return (
    <section className="luxury-container py-16">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((dept, i) => {
          const docCount = getDeptDoctorsCount(dept);

          return (
            <motion.div
              key={dept.id}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                href={`/department/${dept.slug}`}
                className="group block h-full"
              >
                <div className="h-full bg-white rounded-3xl border border-accent/20 shadow-md hover:shadow-md hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden card-gold-accent">
                  {/* Image Header */}
                  <div className="relative h-60 w-full overflow-hidden bg-beige">
                    <Image
                      src={getOptimizedImageUrl(dept.photo, 600, 75)}
                      alt={dept.name}
                      width={400}
                      height={250}
                      quality={75}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-primary/20 to-transparent" />
                    <div className="absolute bottom-4 left-4 rtl:left-auto rtl:right-4 flex items-center gap-1.5 bg-primary/70 backdrop-blur-sm rounded-full px-3.5 py-1.5 border border-white/10 shadow-md">
                      <Users size={14} className="text-accent" />
                      <span className="text-xs text-white font-medium">
                        {formatDoctorsCount(docCount)}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-7 flex-1 flex flex-col justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-serif font-bold text-primary group-hover:text-accent transition-colors mb-2">
                        {dept.name}
                      </h3>
                      <p className="text-xs text-foreground/75 leading-relaxed line-clamp-3">
                        {dept.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-accent/10 mt-auto">
                      <span className="text-xs font-bold text-accent tracking-wide uppercase">
                        {t("Departments.explore")}
                      </span>
                      <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent transition-colors duration-300">
                        <ArrowRight
                          size={15}
                          className="text-accent group-hover:text-white group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

"use client";

import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { MapPin, Phone, Clock, ArrowRight, Maximize2 } from "lucide-react";
import Image from "next/image";
import type { Branch } from "@/lib/types";
import { trackClickMap } from "@/lib/analytics/events";

interface BranchCardProps {
  branch: Branch | any;
  index: number;
  onImageClick?: (index: number) => void;
}

export function BranchCard({ branch, index, onImageClick }: BranchCardProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = useTranslations("Branches");

  const imageUrl =
    branch.image_url || branch.photo || "/AboutPreview/about.webp";

  const branchServices: string[] = Array.isArray(branch.services)
    ? branch.services.map((s: any) =>
        typeof s === "string" ? s : s.name || String(s),
      )
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="h-full"
    >
      <div className="h-full bg-white rounded-3xl border border-accent/20 shadow-md hover:shadow-md hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden card-gold-accent group">
        {/* Photo Header */}
        <div
          onClick={() => onImageClick?.(index)}
          className="relative h-60 w-full overflow-hidden bg-beige cursor-pointer group/img"
          title={
            isAr
              ? "انقر لمشاهدة الصورة بحجم كامل"
              : "Click to view photo in gallery"
          }
        >
          <Image
            src={imageUrl}
            alt={isAr ? branch.name_ar || branch.name : branch.name}
            width={400}
            height={250}
            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-primary/20 to-transparent" />

          {/* Country Badge */}
          {branch.country && (
            <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4 bg-primary/70 backdrop-blur-sm rounded-full px-3.5 py-1 border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
                {branch.country}
              </span>
            </div>
          )}

          {/* Expand / View Photo Badge */}
          <div className="absolute bottom-4 left-4 rtl:left-auto rtl:right-4">
            <span className="inline-flex items-center gap-1.5 bg-primary/70 backdrop-blur-sm rounded-full px-3.5 py-1.5 border border-white/10 text-white text-xs font-medium hover:bg-accent transition-colors shadow-md">
              <Maximize2
                size={13}
                className="text-accent group-hover/img:text-white"
              />
              <span>{t("viewPhoto")}</span>
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-7 flex-1 flex flex-col justify-between gap-4">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-accent font-bold mb-1">
                {t("branchLabel")}
              </p>
              <h3 className="text-xl font-serif font-bold text-primary group-hover:text-accent transition-colors">
                {isAr ? branch.name_ar || branch.name : branch.name}
              </h3>
            </div>

            <div className="flex flex-col gap-3">
              {branch.address && (
                <div className="flex items-start gap-3">
                  <MapPin size={14} className="text-accent mt-0.5 shrink-0" />
                  <p className="text-xs text-foreground/75 leading-relaxed font-medium">
                    {isAr
                      ? branch.address_ar || branch.address
                      : branch.address}
                  </p>
                </div>
              )}
              {branch.phone && (
                <div className="flex items-center gap-3">
                  <Phone size={14} className="text-accent shrink-0" />
                  <p className="text-xs text-foreground/75 font-mono font-medium">
                    {branch.phone}
                  </p>
                </div>
              )}
              {branch.hours && (
                <div className="flex items-center gap-3">
                  <Clock size={14} className="text-accent shrink-0" />
                  <p className="text-xs text-foreground/75 font-medium">
                    {isAr ? branch.hours_ar || branch.hours : branch.hours}
                  </p>
                </div>
              )}
            </div>

            {/* Services available in this branch */}
            {branchServices.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-3 border-t border-accent/10">
                {branchServices.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-full bg-beige border border-accent/20 text-[9px] text-primary font-bold uppercase tracking-wider"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Footer Bar */}
          {(() => {
            const finalMapUrl =
              branch.mapUrl ||
              branch.map_url ||
              (branch.latitude && branch.longitude
                ? `https://www.google.com/maps?q=${branch.latitude},${branch.longitude}`
                : null);

            return (
              <div className="flex items-center justify-between pt-4 border-t border-accent/10 mt-auto">
                {finalMapUrl ? (
                  <a
                    href={finalMapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      trackClickMap({
                        branch_id: branch.id,
                        branch_name: isAr ? branch.name_ar || branch.name : branch.name,
                      })
                    }
                    className="text-xs font-bold text-accent tracking-wide uppercase flex items-center gap-1.5 hover:text-primary transition-colors"
                  >
                    <MapPin size={13} />
                    <span>{t("directions")}</span>
                  </a>
                ) : (
                  <span className="text-xs font-bold text-accent tracking-wide uppercase">
                    {t("branchLabel")}
                  </span>
                )}
                <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent transition-colors duration-300">
                  <ArrowRight
                    size={15}
                    className="text-accent group-hover:text-white group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5 transition-all"
                  />
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </motion.div>
  );
}

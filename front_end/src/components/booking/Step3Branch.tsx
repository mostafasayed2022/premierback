"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { getBranchesByService, Branch } from "@/lib/api";
import { MapPin, Check, Phone } from "lucide-react";
import Image from "next/image";
import { trackSelectBranch } from "@/lib/analytics/events";

interface Step3BranchProps {
  selected: string;
  onSelect: (id: string) => void;
  serviceId?: string;
}

export function Step3Branch({
  selected,
  onSelect,
  serviceId,
}: Step3BranchProps) {
  const t = useTranslations("Booking");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (serviceId) {
      setLoading(true);
      getBranchesByService(Number(serviceId)).then((data) => {
        if (data) {
          setBranches(data);
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [serviceId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 rounded-full border-4 border-accent/20 border-t-accent animate-spin" />
      </div>
    );
  }

  if (branches.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-foreground/70 font-medium">{t("noBranches")}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
      {branches.map((branch) => {
        const isSelected = selected === branch.id;
        const photoSrc = branch.image_url || branch.photo;

        return (
          <button
            key={branch.id}
            type="button"
            onClick={() => {
              onSelect(branch.id);
              trackSelectBranch({
                branch_id: branch.id,
                branch_name: branch.name,
              });
            }}
            className={`group relative flex items-start gap-3 sm:gap-4 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border-2 text-left rtl:text-right transition-all duration-300 active:scale-[0.98] ${
              isSelected
                ? "border-accent bg-accent/8 ring-2 ring-accent/30 shadow-md shadow-accent/10 translate-y-[-2px]"
                : "border-accent/15 bg-white hover:border-accent/50 hover:shadow-lg hover:-translate-y-1"
            }`}
          >
            {/* Branch Image Preview */}
            <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl overflow-hidden shrink-0 border border-accent/20 bg-beige/50 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform mt-0.5">
              {photoSrc ? (
                <Image
                  src={photoSrc}
                  alt={branch.name || "Branch"}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <div
                  className={`w-full h-full flex items-center justify-center transition-colors ${
                    isSelected
                      ? "bg-accent text-white"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  <MapPin size={20} className="sm:hidden" />
                  <MapPin size={24} className="hidden sm:block" />
                </div>
              )}
            </div>

            {/* Branch Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-serif font-bold text-primary text-sm sm:text-base leading-snug truncate group-hover:text-accent transition-colors">
                {branch.name}
              </h3>
              <div className="flex items-start gap-1 sm:gap-1.5 mt-1 sm:mt-1.5 text-[11px] sm:text-xs text-foreground/75">
                <MapPin size={12} className="text-accent shrink-0 mt-0.5" />
                <span className="line-clamp-2 leading-relaxed">
                  {branch.address}
                </span>
              </div>
              {branch.phone && (
                <div className="flex items-center gap-1 sm:gap-1.5 mt-1.5 sm:mt-2 text-[10px] sm:text-[11px] text-foreground/60 font-mono">
                  <Phone size={10} className="text-accent shrink-0" />
                  <span>{branch.phone}</span>
                </div>
              )}
            </div>

            {/* Selection Checkmark Badge */}
            <div
              className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ml-auto rtl:ml-0 rtl:mr-auto mt-0.5 ${
                isSelected
                  ? "bg-accent text-white scale-110 shadow-md"
                  : "border-2 border-accent/30 bg-transparent group-hover:border-accent"
              }`}
            >
              {isSelected && (
                <Check size={12} strokeWidth={3} className="sm:hidden" />
              )}
              {isSelected && (
                <Check size={14} strokeWidth={3} className="hidden sm:block" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

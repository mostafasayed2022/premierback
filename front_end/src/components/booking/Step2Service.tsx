"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  getDepartments,
  getServicesByDepartment,
  Department,
  Service,
} from "@/lib/api";
import { Check, Clock, Sparkles } from "lucide-react";
import Image from "next/image";
import { trackViewService } from "@/lib/analytics/events";

interface Step2ServiceProps {
  deptId: string;
  selected: string;
  onSelect: (id: string) => void;
}

export function Step2Service({
  deptId,
  selected,
  onSelect,
}: Step2ServiceProps) {
  const t = useTranslations("Booking");

  const [departments, setDepartments] = useState<Department[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDepartments(),
      deptId ? getServicesByDepartment(Number(deptId)) : Promise.resolve([]),
    ]).then(([depts, svcs]) => {
      if (depts) setDepartments(depts);
      if (svcs) setServices(svcs);
      setLoading(false);
    });
  }, [deptId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 rounded-full border-4 border-accent/20 border-t-accent animate-spin" />
      </div>
    );
  }

  const dept = departments.find((d) => d.id === deptId);
  const filteredServices = services.filter(
    (s) => !s.category || s.category === dept?.slug,
  );

  if (filteredServices.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-foreground/70 font-medium">{t("noServices")}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
      {filteredServices.map((svc) => {
        const isSelected = selected === svc.id;

        return (
          <button
            key={svc.id}
            type="button"
            onClick={() => {
              onSelect(svc.id);
              trackViewService({
                service_id: svc.id,
                service_name: svc.name,
                service_category: svc.category,
              });
            }}
            className={`group relative flex items-start gap-3 sm:gap-4 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border-2 text-left rtl:text-right transition-all duration-300 active:scale-[0.98] ${
              isSelected
                ? "border-accent bg-accent/8 ring-2 ring-accent/30 shadow-md shadow-accent/10 translate-y-[-2px]"
                : "border-accent/15 bg-white hover:border-accent/50 hover:shadow-lg hover:-translate-y-1"
            }`}
          >
            {/* Service Photo / Icon */}
            <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl overflow-hidden shrink-0 border border-accent/20 bg-beige/50 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform mt-0.5">
              {svc.photo ? (
                <Image
                  src={svc.photo}
                  alt={svc.name || "Service"}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <div
                  className={`w-full h-full flex items-center justify-center text-xl sm:text-2xl transition-colors ${
                    isSelected
                      ? "bg-accent text-white"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  <Sparkles size={20} className="sm:hidden" />
                  <Sparkles size={24} className="hidden sm:block" />
                </div>
              )}
            </div>

            {/* Service Details */}
            <div className="flex-1 min-w-0">
              <h3 className="font-serif font-bold text-primary text-sm sm:text-base leading-snug truncate group-hover:text-accent transition-colors">
                {svc.name}
              </h3>
              <p className="text-[11px] sm:text-xs text-foreground/75 mt-0.5 sm:mt-1 line-clamp-2 leading-relaxed">
                {svc.description}
              </p>

              <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-3 flex-wrap">
                {svc.price != null && (
                  <span className="inline-block px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-accent/15 border border-accent/30 text-accent font-bold text-[10px] sm:text-xs">
                    ${svc.price}
                  </span>
                )}
                {svc.duration && (
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-foreground/60 font-medium">
                    <Clock size={11} className="text-accent" />
                    {svc.duration}
                  </span>
                )}
              </div>
            </div>

            {/* Selection Checkmark */}
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

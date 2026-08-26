"use client";

import React, { useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Phone,
} from "lucide-react";
import Image from "next/image";
import { trackViewBranch } from "@/lib/analytics/events";

export interface LightboxItem {
  id: string;
  image: string;
  title: string;
  title_ar?: string;
  description?: string;
  description_ar?: string;
  branch_name?: string | null;
  country?: string;
  address?: string;
  address_ar?: string;
  phone?: string;
}

interface BranchLightboxModalProps {
  isOpen: boolean;
  activeItem: LightboxItem | null;
  activeIndex: number | null;
  totalItems: number;
  onClose: () => void;
  onNext: (e?: React.MouseEvent) => void;
  onPrev: (e?: React.MouseEvent) => void;
}

export function BranchLightboxModal({
  isOpen,
  activeItem,
  activeIndex,
  totalItems,
  onClose,
  onNext,
  onPrev,
}: BranchLightboxModalProps) {
  const t = useTranslations("Branches");
  const locale = useLocale();
  const isAr = locale === "ar";

  useEffect(() => {
    if (isOpen && activeItem) {
      const branchName =
        activeItem.branch_name ||
        (isAr ? activeItem.title_ar || activeItem.title : activeItem.title);
      trackViewBranch({
        branch_id: activeItem.id,
        branch_name: branchName,
        locale,
      });
    }
  }, [isOpen, activeItem, isAr, locale]);

  if (!isOpen || !activeItem || activeIndex === null) return null;

  const itemTitle = isAr
    ? activeItem.title_ar || activeItem.title
    : activeItem.title;
  const itemDesc = isAr
    ? activeItem.description_ar || activeItem.description
    : activeItem.description;
  const itemAddress = isAr
    ? activeItem.address_ar || activeItem.address
    : activeItem.address;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-[#0B131B] flex flex-col justify-between p-4 md:p-8 overflow-hidden select-none"
        onClick={onClose}
      >
        {/* Prominent Fixed Close Button */}
        <button
          onClick={onClose}
          className="fixed top-5 right-5 md:top-8 md:right-8 z-[10000] w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-all duration-300 hover:scale-110 focus:outline-none shadow-md backdrop-blur-sm group"
          aria-label="Close modal"
        >
          <X
            size={24}
            className="group-hover:rotate-90 transition-transform duration-300"
          />
        </button>

        {/* Top Header Badge */}
        <div className="w-full flex items-center justify-between z-10 pt-2 px-2 md:px-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#C8A96B] animate-pulse" />
            <span className="text-[11px] uppercase font-bold text-[#C8A96B] tracking-widest">
              {t("branchGalleryHeader")}
            </span>
          </div>
        </div>

        {/* Main Center Image Container with Arrows */}
        <div className="relative flex-1 w-full flex items-center justify-center my-auto py-2">
          <button
            onClick={isAr ? onNext : onPrev}
            className="absolute left-2 md:left-8 z-20 w-12 h-12 md:w-14 md:h-14 rounded-full border border-white/15 bg-black/60 hover:bg-[#C8A96B]/20 hover:border-[#C8A96B]/50 text-white flex items-center justify-center transition-all duration-300 focus:outline-none backdrop-blur-sm group shadow-md"
          >
            <ChevronLeft
              size={28}
              className="group-hover:-translate-x-1 transition-transform"
            />
          </button>

          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="relative w-full max-w-5xl h-[55vh] md:h-[62vh] flex items-center justify-center px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={activeItem.image}
              alt={itemTitle}
              fill
              sizes="100vw"
              className="object-contain rounded-xl drop-shadow-md select-none"
            />
          </motion.div>

          <button
            onClick={isAr ? onPrev : onNext}
            className="absolute right-2 md:right-8 z-20 w-12 h-12 md:w-14 md:h-14 rounded-full border border-white/15 bg-black/60 hover:bg-[#C8A96B]/20 hover:border-[#C8A96B]/50 text-white flex items-center justify-center transition-all duration-300 focus:outline-none backdrop-blur-sm group shadow-md"
          >
            <ChevronRight
              size={28}
              className="group-hover:translate-x-1 transition-transform"
            />
          </button>
        </div>

        {/* Bottom Details Card */}
        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="w-full max-w-2xl mx-auto text-center flex flex-col items-center gap-2 px-6 py-4 rounded-2xl bg-[#16222F] border border-white/15 shadow-md mb-2"
          onClick={(e) => e.stopPropagation()}
        >
          {(activeItem.branch_name || activeItem.country) && (
            <span className="text-[10px] text-[#C8A96B] uppercase font-bold tracking-[0.25em] px-3.5 py-1 rounded-full bg-[#C8A96B]/20 border border-[#C8A96B]/30">
              {activeItem.branch_name || activeItem.country || t("branchLabel")}
            </span>
          )}

          <h3 className="text-xl md:text-2xl font-serif text-white font-semibold tracking-wide">
            {itemTitle}
          </h3>

          {itemDesc && (
            <p className="text-slate-200 text-xs md:text-sm max-w-lg leading-relaxed font-normal">
              {itemDesc}
            </p>
          )}

          {(itemAddress || activeItem.phone) && (
            <p className="text-slate-200 text-xs md:text-sm max-w-lg leading-relaxed font-normal flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
              {itemAddress && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={13} className="text-[#C8A96B]" />
                  {itemAddress}
                </span>
              )}
              {activeItem.phone && (
                <span className="inline-flex items-center gap-1 font-mono">
                  <Phone size={13} className="text-[#C8A96B]" />
                  {activeItem.phone}
                </span>
              )}
            </p>
          )}

          <span className="text-[11px] text-slate-400 font-mono tracking-widest mt-1">
            {activeIndex + 1} / {totalItems}
          </span>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

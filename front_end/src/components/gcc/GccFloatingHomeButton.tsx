"use client";

// ─── GccFloatingHomeButton.tsx ───────────────────────────────────────────────
// Luxury Floating Side Button to navigate back to the main homepage.
// Seamlessly integrated for GCC landing pages with dark glassmorphism & gold accents.

import React, { useState } from "react";
import Link from "next/link";
import { Home, ArrowRight } from "lucide-react";

export function GccFloatingHomeButton() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <aside
      aria-label="العودة للصفحة الرئيسية"
      className="fixed top-5 right-4 sm:top-6 sm:right-6 z-50 pointer-events-auto select-none"
    >
      <Link
        href="/ar"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative flex items-center gap-2.5 px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-full bg-[#0a1b2a]/90 hover:bg-[#0d2235] text-white/95 hover:text-amber-300 border border-amber-400/30 hover:border-amber-400/80 backdrop-blur-md shadow-xl shadow-black/40 hover:shadow-amber-400/10 transition-all duration-300 hover:scale-105 active:scale-95 touch-manipulation focus:outline-none focus:ring-2 focus:ring-amber-400/40"
      >
        {/* Subtle pulsating gold indicator */}
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
        </span>

        {/* Home icon with subtle rotation effect */}
        <Home
          size={16}
          className="text-amber-400 group-hover:scale-110 transition-transform duration-300 shrink-0"
        />

        {/* Label */}
        <span className="text-xs sm:text-sm font-bold tracking-wide">
          الرئيسية
        </span>

        {/* Arrow on hover */}
        <ArrowRight
          size={14}
          className="text-amber-400/80 -mr-0.5 group-hover:translate-x-[-2px] transition-transform duration-300 hidden sm:inline-block"
        />

        {/* Floating tooltip label on hover */}
        <div
          className={`absolute top-full mt-2 right-0 pointer-events-none transition-all duration-200 hidden sm:block ${
            isHovered
              ? "opacity-100 translate-y-0 visible"
              : "opacity-0 -translate-y-1 invisible"
          }`}
        >
          <div className="bg-[#07131e]/95 text-white/90 text-[11px] font-medium px-3 py-1.5 rounded-xl border border-amber-400/20 shadow-lg whitespace-nowrap">
            العودة لموقع Premier Health الرئيسي
          </div>
        </div>
      </Link>
    </aside>
  );
}

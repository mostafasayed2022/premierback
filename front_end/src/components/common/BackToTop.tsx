"use client";

// ─── BackToTop.tsx ────────────────────────────────────────────────────────────
// Global, accessible, premium Back-to-Top floating button.
// • Client Component – scroll state requires browser APIs.
// • Appears after scrolling ≥450px; hides near the top.
// • Smooth scroll (instant fallback for prefers-reduced-motion).
// • Uses existing Premier Health colour tokens (navy / gold / beige).
// • RTL-aware positioning via Tailwind logical utilities (end-*).
// • Positioned to avoid collision with FloatingWhatsAppCTA and StickyMobileCTA.
// • Uses lucide-react (already installed) – no new dependencies.
// • Uses next-intl for accessible labels across all 8 locales.

import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { useTranslations } from "next-intl";

const SCROLL_THRESHOLD = 450;

export function BackToTop() {
  const t = useTranslations("common");
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      // Use requestAnimationFrame to debounce scroll events efficiently
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        setVisible(window.scrollY >= SCROLL_THRESHOLD);
        rafRef.current = null;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Run once on mount in case the page loads mid-scroll
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const handleClick = () => {
    // Respect prefers-reduced-motion at the JS level
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    window.scrollTo({
      top: 0,
      behavior: prefersReduced ? "instant" : "smooth",
    } as ScrollToOptions);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={t("backToTop")}
      // ── Visibility & animation ────────────────────────────────────────────
      // Tailwind CSS transition classes handle opacity + scale.
      // pointer-events-none when hidden so clicks pass through to elements beneath.
      className={[
        // ── Base layout ──
        "fixed z-40 flex items-center justify-center",
        // ── Size: 44×44px mobile (touch target), 48×48px desktop ──
        "w-11 h-11 md:w-12 md:h-12",
        // ── Position ──
        // Desktop: above FloatingWhatsAppCTA (bottom-7 + 64px button + 16px gap ≈ bottom-28)
        // Mobile: above WhatsApp float (bottom-20) + a comfortable gap (bottom-36)
        // RTL: use logical `end-4` / `end-7` so it mirrors correctly in Arabic
        "bottom-36 md:bottom-28 end-4 md:end-7",
        // ── Premier Health design tokens ──
        // Navy background, gold border, white icon
        "rounded-full border-2 border-[#C8A96B]/70",
        "bg-[#1F3D5A] text-white",
        "shadow-lg shadow-[#1F3D5A]/30",
        // ── Hover & active states ──
        "hover:bg-[#C8A96B] hover:border-[#C8A96B] hover:shadow-[#C8A96B]/40",
        "hover:scale-110 active:scale-95",
        // ── Focus ring (keyboard accessibility) ──
        "focus:outline-none focus-visible:ring-4 focus-visible:ring-[#C8A96B]/50 focus-visible:ring-offset-2",
        // ── Touch target ──
        "touch-manipulation",
        // ── Transitions ──
        "transition-all duration-300 ease-out",
        // ── Visibility animation (opacity + scale) ──
        visible
          ? "opacity-100 scale-100 pointer-events-auto"
          : "opacity-0 scale-90 pointer-events-none",
      ].join(" ")}
    >
      <ArrowUp
        size={20}
        strokeWidth={2.5}
        aria-hidden="true"
        // The arrow always points up — no RTL flip needed (purely directional icon)
      />
    </button>
  );
}

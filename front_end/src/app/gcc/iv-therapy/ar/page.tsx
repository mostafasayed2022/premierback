// ─── GCC IV Therapy Arabic Landing Page ───────────────────────────────────────
// Route: /gcc/iv-therapy/ar
// Audience: GCC visitors in Cairo looking for premium IV Therapy
// Language: Arabic (RTL)
// Architecture: Server Component by default, Client Components where needed

import { Suspense } from "react";
import { GccHero } from "@/components/gcc/GccHero";
import { GccTrustBar } from "@/components/gcc/GccTrustBar";
import { GccServices } from "@/components/gcc/GccServices";
import { GccMedicalSupervision } from "@/components/gcc/GccMedicalSupervision";
import { GccSessionInfo } from "@/components/gcc/GccSessionInfo";
import { GccWhoItsFor } from "@/components/gcc/GccWhoItsFor";
import { GccLocations } from "@/components/gcc/GccLocations";
import { GccDoctors } from "@/components/gcc/GccDoctors";
import { GccTestimonials } from "@/components/gcc/GccTestimonials";
import { GccFaq } from "@/components/gcc/GccFaq";
import { GccFinalCTA } from "@/components/gcc/GccFinalCTA";

// Revalidate page every 6 hours (for doctors API data)
export const revalidate = 21600;

export default function GccIvTherapyArPage() {
  return (
    <main>
      {/* 1. Hero — Primary conversion section */}
      <GccHero />

      {/* 2. Trust Bar — Medical credibility indicators */}
      <GccTrustBar />

      {/* 3. Services — IV Therapy options */}
      <GccServices />

      {/* 4. Medical Supervision — How clinical process works */}
      <GccMedicalSupervision />

      {/* 5. Session Info — Practical answers */}
      <GccSessionInfo />

      {/* 6. Who It's For — Target audience */}
      <GccWhoItsFor />

      {/* 7. Locations — 3 branches with tracked CTAs */}
      <GccLocations />

      {/* 8. Doctors — Real verified doctors with Booking, WhatsApp & Call */}
      <GccDoctors />

      {/* 9. Testimonials — Social proof */}
      <GccTestimonials />

      {/* 10. FAQ — GCC-specific questions */}
      <GccFaq />

      {/* 11. Final CTA — Last conversion opportunity */}
      <GccFinalCTA />
    </main>
  );
}

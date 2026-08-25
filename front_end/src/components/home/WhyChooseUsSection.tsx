"use client";

import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import {
  Sparkles,
  Shield,
  Heart,
  Activity,
  CheckCircle,
  ArrowUpRight,
  Award,
  Zap,
} from "lucide-react";
import Image from "next/image";

export default function WhyChooseUsSection() {
  const t = useTranslations();
  const locale = useLocale();
  const isAr = locale === "ar";

  const cards = [
    {
      num: "01",
      title: t("Common.excellence"),
      description: t("WhyChooseUs.excellence"),
      icon: Sparkles,
      tag: t("Common.excellence") || "Excellence",
    },
    {
      num: "02",
      title: t("Common.integrity"),
      description: t("WhyChooseUs.integrity"),
      icon: Shield,
      tag: t("Common.integrity") || "Integrity",
    },
    {
      num: "03",
      title: t("Common.patientCentered"),
      description: t("WhyChooseUs.patientCentered"),
      icon: Heart,
      tag: t("Common.patientCentered") || "Patient Care",
    },
    {
      num: "04",
      title: t("Common.compassion"),
      description: t("WhyChooseUs.compassion"),
      icon: Activity,
      tag: t("Common.compassion") || "Compassion",
    },
    {
      num: "05",
      title: t("Common.innovation"),
      description: t("WhyChooseUs.innovation"),
      icon: CheckCircle,
      tag: t("Common.innovation") || "Innovation",
    },
  ];

  return (
    <section className="relative py-16 md:py-24 overflow-hidden bg-gradient-to-b from-white via-[#fcfbf9] to-white">
      {/* Ambient background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 right-0 h-[350px] w-[350px] rounded-full bg-accent/10 blur-[140px]" />
        <div className="absolute bottom-10 left-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[160px]" />
      </div>

      <div className="luxury-container relative z-10">
        {/* Header */}
        <div className="relative max-w-3xl mx-auto text-center mb-12 md:mb-16 flex flex-col items-center gap-4">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-accent text-[10px] sm:text-[11px] uppercase tracking-[0.25em] font-bold bg-accent/10 border border-accent/30 px-4 py-1.5 rounded-full inline-flex items-center gap-2 shadow-sm"
          >
            <Sparkles size={12} className="text-accent animate-pulse" />
            {t("Home.whyChooseUsBadge")}
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-serif text-primary tracking-tight leading-tight"
          >
            {t("Home.whyTitle")}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-sm md:text-base text-foreground/80 leading-relaxed max-w-2xl font-medium"
          >
            {t("Home.whySubtitle")}
          </motion.p>

          <div className="flex items-center gap-4 w-full justify-center mt-2">
            <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-accent/50" />
            <div className="w-2 h-2 rotate-45 border border-accent/80 bg-white" />
            <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-accent/50" />
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
          {/* Item 0: Featured Image Card (LG 4 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-4 md:col-span-1 group relative overflow-hidden rounded-[2rem] border border-accent/20 shadow-md hover:shadow-md hover:-translate-y-1.5 transition-all duration-500 min-h-[320px] md:min-h-[400px] flex flex-col justify-end p-6 md:p-8"
          >
            <Image
              src="/hero/hero4.webp"
              alt="Premier Health Clinic"
              fill
              sizes="(max-width: 1024px) 100vw, 33vw"
              className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#243642]/95 via-[#243642]/40 to-transparent" />

            <div className="relative z-10 flex flex-col gap-3">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 text-white text-[11px] font-bold uppercase tracking-wider w-fit">
                <Shield className="w-3.5 h-3.5 text-accent" />
                Premier Guarantee
              </span>
              <h3 className="text-white text-2xl md:text-3xl font-serif leading-tight">
                {t("Home.whyPriority")}
              </h3>
            </div>
          </motion.div>

          {/* Item 1: Excellence - Featured Dark Luxury Card (LG 8 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-8 md:col-span-1 group relative overflow-hidden rounded-[2rem] bg-[#243642] border border-accent/30 p-7 md:p-10 shadow-md hover:shadow-md hover:-translate-y-1.5 transition-all duration-500 flex flex-col justify-between"
          >
            {/* Subtle card glow inside */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent/20 rounded-full blur-3xl pointer-events-none group-hover:bg-accent/30 transition-all duration-500" />

            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-accent text-[11px] font-bold tracking-widest uppercase">
                  {cards[0].num} // {cards[0].tag}
                </span>
                <div className="w-12 h-12 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent group-hover:rotate-12 transition-transform duration-500">
                  <Sparkles className="w-6 h-6" />
                </div>
              </div>

              <h3 className="font-serif text-2xl md:text-3xl text-white mb-3 group-hover:text-accent transition-colors">
                {cards[0].title}
              </h3>
              <p className="text-white/80 leading-relaxed text-sm md:text-base font-normal max-w-xl">
                {cards[0].description}
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-accent">
                <Award className="w-4 h-4" />
                <span>International Medical Protocols &amp; Clinical Standards</span>
              </div>
              <ArrowUpRight className="w-5 h-5 text-white/40 group-hover:text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all rtl:rotate-90" />
            </div>
          </motion.div>

          {/* Item 2: Integrity (LG 4 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-4 group relative rounded-[2rem] bg-white border border-[#e8e0d5] hover:border-accent/50 p-7 shadow-sm hover:shadow-md hover:-translate-y-1.5 transition-all duration-500 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <span className="text-[#998675] text-[11px] font-bold tracking-widest uppercase">
                  {cards[1].num} // {cards[1].tag}
                </span>
                <div className="w-11 h-11 rounded-2xl bg-[#f7f2ea] text-primary border border-accent/20 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-500">
                  <Shield className="w-5 h-5" />
                </div>
              </div>

              <h3 className="font-serif text-xl md:text-2xl text-primary mb-2 group-hover:text-accent transition-colors">
                {cards[1].title}
              </h3>
              <p className="text-foreground/80 leading-relaxed text-sm font-medium">
                {cards[1].description}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-accent/10 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground">
                100% Ethical Medical Protocols
              </span>
              <div className="h-1.5 w-1.5 rounded-full bg-accent group-hover:scale-150 transition-transform" />
            </div>
          </motion.div>

          {/* Item 3: Patient Centered (LG 4 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-4 group relative rounded-[2rem] bg-white border border-[#e8e0d5] hover:border-accent/50 p-7 shadow-sm hover:shadow-md hover:-translate-y-1.5 transition-all duration-500 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <span className="text-[#998675] text-[11px] font-bold tracking-widest uppercase">
                  {cards[2].num} // {cards[2].tag}
                </span>
                <div className="w-11 h-11 rounded-2xl bg-[#f7f2ea] text-primary border border-accent/20 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-500">
                  <Heart className="w-5 h-5" />
                </div>
              </div>

              <h3 className="font-serif text-xl md:text-2xl text-primary mb-2 group-hover:text-accent transition-colors">
                {cards[2].title}
              </h3>
              <p className="text-foreground/80 leading-relaxed text-sm font-medium">
                {cards[2].description}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-accent/10 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground">
                Tailored Care Pathways
              </span>
              <div className="h-1.5 w-1.5 rounded-full bg-accent group-hover:scale-150 transition-transform" />
            </div>
          </motion.div>

          {/* Item 4: Compassion (LG 4 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-4 group relative rounded-[2rem] bg-white border border-[#e8e0d5] hover:border-accent/50 p-7 shadow-sm hover:shadow-md hover:-translate-y-1.5 transition-all duration-500 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <span className="text-[#998675] text-[11px] font-bold tracking-widest uppercase">
                  {cards[3].num} // {cards[3].tag}
                </span>
                <div className="w-11 h-11 rounded-2xl bg-[#f7f2ea] text-primary border border-accent/20 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-500">
                  <Activity className="w-5 h-5" />
                </div>
              </div>

              <h3 className="font-serif text-xl md:text-2xl text-primary mb-2 group-hover:text-accent transition-colors">
                {cards[3].title}
              </h3>
              <p className="text-foreground/80 leading-relaxed text-sm font-medium">
                {cards[3].description}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-accent/10 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground">
                Empathetic Patient Journeys
              </span>
              <div className="h-1.5 w-1.5 rounded-full bg-accent group-hover:scale-150 transition-transform" />
            </div>
          </motion.div>

          {/* Item 5: Innovation - Full Width Luxury Highlight Card (LG 12 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="lg:col-span-12 group relative rounded-[2rem] bg-gradient-to-r from-[#f7f2ea] via-white to-[#f7f2ea] border border-accent/30 p-7 md:p-9 shadow-md hover:shadow-md transition-all duration-500"
          >
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 shadow-md">
                  <Zap className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-accent text-[11px] font-bold tracking-widest uppercase">
                      {cards[4].num} // {cards[4].tag}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                      State-of-the-Art
                    </span>
                  </div>
                  <h3 className="font-serif text-2xl text-primary mb-1">
                    {cards[4].title}
                  </h3>
                  <p className="text-foreground/80 text-sm max-w-2xl font-medium">
                    {cards[4].description}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <div className="px-4 py-2 rounded-xl bg-white border border-accent/20 text-xs font-bold text-primary flex items-center gap-2 shadow-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Cutting-Edge Diagnostics
                </div>
                <div className="px-4 py-2 rounded-xl bg-white border border-accent/20 text-xs font-bold text-primary flex items-center gap-2 shadow-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Advanced Telehealth Integration
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

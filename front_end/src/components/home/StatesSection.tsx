"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useTranslations } from "next-intl";
import { Stethoscope, Building2, Users, Sparkles } from "lucide-react";

// Count-up timer component
function AnimatedCount({ value }: { value: string }) {
  const numericVal = parseInt(value.replace(/[^0-9]/g, ""), 10) || 0;
  // Extract suffix: "+10" → suffix "+", "250,000" → suffix ""
  const suffix = value.includes("+") ? "+" : "";
  // Start at the real value so it's never blank/zero on first render
  const [count, setCount] = useState(numericVal);
  const [animationStarted, setAnimationStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  useEffect(() => {
    if (!isInView || animationStarted) return;
    setAnimationStarted(true);
    setCount(0); // reset to 0 to begin count-up animation

    let startTime: number | null = null;
    const duration = 2000;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out quad
      const easeProgress = progress * (2 - progress);
      const current = Math.floor(easeProgress * numericVal);
      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setCount(numericVal);
      }
    };

    requestAnimationFrame(step);
  }, [isInView, numericVal, animationStarted]);

  const formattedCount = count >= 1000 ? count.toLocaleString() : count;

  return (
    <span ref={ref}>
      {formattedCount}
      {suffix}
    </span>
  );
}

export default function StatsSection() {
  const t = useTranslations();

  const stats = [
    {
      value: "+10",
      label: t("Home.statsDoctorsLabel"),
      sublabel: t("Home.statsDoctorsSublabel"),
      icon: Stethoscope,
    },
    {
      value: "+5",
      label: t("Home.statsDeptLabel"),
      sublabel: t("Home.statsDeptSublabel"),
      icon: Building2,
    },
    {
      value: "+250,000",
      label: t("Home.statsPatientsLabel"),
      sublabel: t("Home.statsPatientsSublabel"),
      icon: Users,
    },
    {
      value: "+15",
      label: t("Home.statsServicesLabel"),
      sublabel: t("Home.statsServicesSublabel"),
      icon: Sparkles,
    },
  ];

  return (
    <section className="relative py-10 md:py-14 bg-gradient-to-b from-white via-[#fcfbf9] to-white border-y border-accent/15 overflow-hidden">
      {/* Background Subtle Accent Lights */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="luxury-container relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative rounded-2xl md:rounded-3xl bg-white border border-[#e8e0d5] hover:border-accent/50 p-5 md:p-7 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center"
              >
                {/* Icon Badge */}
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-[#f7f2ea] text-primary border border-accent/20 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-accent group-hover:rotate-6 transition-all duration-300 shadow-sm">
                  <Icon className="w-6 h-6 md:w-7 md:h-7" />
                </div>

                {/* Number Value with Animated Timer */}
                <span className="text-3xl sm:text-4xl md:text-5xl font-serif text-accent font-bold tracking-tight mb-1 group-hover:scale-105 transition-transform duration-300">
                  <AnimatedCount value={stat.value} />
                </span>

                {/* Label */}
                <span className="text-sm md:text-base font-serif text-primary font-bold mb-1">
                  {stat.label}
                </span>

                {/* Sublabel */}
                <span className="text-[11px] md:text-xs text-foreground/75 font-medium">
                  {stat.sublabel}
                </span>

                {/* Bottom Decorative Line */}
                <div className="mt-4 w-8 h-0.5 rounded-full bg-accent/30 group-hover:w-16 group-hover:bg-accent transition-all duration-300" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

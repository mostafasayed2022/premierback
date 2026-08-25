"use client";

import * as React from "react";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import {
  PhoneCall,
  ChevronDown,
  Check,
  Mail,
  Clock,
  User,
  LogIn,
  UserPlus,
  ShieldCheck,
  Stethoscope,
  Sparkles,
} from "lucide-react";
import { usePatientAuth } from "@/context/PatientAuthContext";
import { LANGUAGES } from "./NavbarConstants";
import { getUserRole, type UserRole } from "@/lib/api/auth";

interface NavTopBarProps {
  mounted: boolean;
}

export function NavTopBar({ mounted }: NavTopBarProps) {
  const [langOpen, setLangOpen] = React.useState(false);
  const [role, setRole] = React.useState<UserRole | null>(null);
  const t = useTranslations("Nav");
  const currentLocale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const {
    patientUser,
    isAuthenticated: patientIsAuthenticated,
    logout: patientLogout,
  } = usePatientAuth();

  // Read role once on mount (client-only)
  React.useEffect(() => {
    setRole(getUserRole());
  }, [patientIsAuthenticated]);

  // Role badge config
  const roleBadge: Record<
    UserRole,
    { label: string; color: string; icon: React.ReactNode }
  > = {
    admin: {
      label: "ADMIN",
      color: "#E53E3E",
      icon: <ShieldCheck size={11} />,
    },
    doctor: {
      label: "DOCTOR",
      color: "#38A169",
      icon: <Stethoscope size={11} />,
    },
    patient: { label: "PATIENT", color: "#C8A96B", icon: <User size={11} /> },
  };

  const handleLanguageChange = (newLocale: string) => {
    setLangOpen(false);
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div className="hidden lg:block bg-[#2A3F50] text-white/90 border-b border-[#1A2A38]">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-8 h-10 flex items-center justify-between text-[11px] font-medium tracking-wide">
        {/* Left Side: Contact Info (Branch Numbers & Email) + GCC Landing Link */}
        <div className="flex items-center gap-4 xl:gap-5">
          {/* Branch Phone Numbers */}
          <div className="flex items-center gap-3 text-[10px] xl:text-[11px]">
            <a
              href="tel:+201200644663"
              className="flex items-center gap-1.5 hover:text-amber-300 transition-colors"
              title={currentLocale === "ar" ? "فرع فيرمونت نايل سيتي" : "Fairmont Nile City Branch"}
            >
              <PhoneCall size={12} className="text-[#C8A96B] shrink-0" />
              <span>{currentLocale === "ar" ? "فيرمونت:" : "Fairmont:"}</span>
              <span dir="ltr" className="font-bold">+20 11 11977705</span>
            </a>

            <span className="text-white/30">•</span>

            <a
              href="tel:+201111977713"
              className="flex items-center gap-1.5 hover:text-amber-300 transition-colors"
              title={currentLocale === "ar" ? "فرع أركان بلازا" : "Arkan Plaza Branch"}
            >
              <span>{currentLocale === "ar" ? "أركان:" : "Arkan:"}</span>
              <span dir="ltr" className="font-bold">+20 11 11977713</span>
            </a>

            <span className="text-white/30">•</span>

            <a
              href="tel:+201111977712"
              className="flex items-center gap-1.5 hover:text-amber-300 transition-colors"
              title={currentLocale === "ar" ? "فرع سوديك EDNC" : "EDNC Sodic Branch"}
            >
              <span>{currentLocale === "ar" ? "سوديك:" : "Sodic:"}</span>
              <span dir="ltr" className="font-bold">+20 11 11977712</span>
            </a>
          </div>

          <span className="w-[1px] h-3.5 bg-white/20" />

          {/* Email */}
          <a
            href="mailto:info@premierhealthclinics.com"
            className="flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <Mail size={12} className="text-[#C8A96B]" />
            <span>info@premierhealthclinics.com</span>
          </a>

          {/* Separator */}
          <span className="w-[1px] h-3.5 bg-white/20" />

          {/* GCC IV Therapy Landing Page Link */}
          <a
            href="/gcc/iv-therapy/ar"
            className="group flex items-center gap-1.5 hover:text-white transition-colors"
            title={t("gcc")}
          >
            <Sparkles
              size={13}
              className="text-[#C8A96B] group-hover:text-amber-300 transition-colors"
            />
            <span className="font-bold">{t("gcc")}</span>
            <span
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black tracking-widest"
              style={{
                backgroundColor: "#C8A96B22",
                color: "#C8A96B",
                border: "1px solid #C8A96B44",
              }}
            >
              {t("gccBadge")}
            </span>
          </a>
        </div>

        {/* Right Side: Lang, Auth, Portal */}
        <div className="flex items-center gap-5">
          {/* Language Switcher */}
          <div className="relative group">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 hover:text-white transition-colors py-2 focus:outline-none"
            >
              <span
                className={`fi fi-${LANGUAGES.find((l) => l.code === currentLocale)?.flag ?? "un"} text-lg rounded-sm shadow-sm`}
                style={{
                  width: "1.25rem",
                  height: "0.9rem",
                  display: "inline-block",
                }}
              />
              <span className="uppercase font-bold">{currentLocale}</span>
              <ChevronDown
                size={11}
                className="opacity-70 group-hover:opacity-100 transition-opacity"
              />
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-0 w-44 rounded-b-xl border border-slate-200 bg-white p-1.5 shadow-md animate-fade-in focus:outline-none z-50">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className="flex w-full items-center gap-2 justify-between rounded-md px-3 py-2 text-left text-[11px] font-bold text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`fi fi-${lang.flag} rounded-sm shadow-sm flex-shrink-0`}
                        style={{
                          width: "1.25rem",
                          height: "0.9rem",
                          display: "inline-block",
                        }}
                      />
                      <span>{lang.label}</span>
                    </span>
                    {currentLocale === lang.code && (
                      <Check size={12} className="text-primary flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="w-[1px] h-3.5 bg-white/20" />

          {/* Auth section */}
          {mounted && patientIsAuthenticated ? (
            <div className="flex items-center gap-3">
              {role === "admin" ? (
                <div className="flex items-center gap-1.5 text-[#C8A96B] font-bold">
                  <User size={13} className="text-[#C8A96B]" />
                  <span>
                    {t("welcomeHi")}
                    {patientUser?.first_name || patientUser?.username}
                  </span>
                </div>
              ) : (
                <Link
                  href="/profile"
                  className="flex items-center gap-1.5 text-[#C8A96B] font-bold hover:underline transition-colors"
                >
                  <User size={13} className="text-[#C8A96B]" />
                  <span>
                    {t("welcomeHi")}
                    {patientUser?.first_name || patientUser?.username}
                  </span>
                </Link>
              )}
              {/* Role badge */}
              {role && roleBadge[role] && (
                <span
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black tracking-widest"
                  style={{
                    backgroundColor: roleBadge[role].color + "22",
                    color: roleBadge[role].color,
                    border: `1px solid ${roleBadge[role].color}44`,
                  }}
                >
                  {roleBadge[role].icon}
                  {roleBadge[role].label}
                </span>
              )}
              <button
                onClick={patientLogout}
                className="hover:text-red-400 transition-colors uppercase font-bold text-[10px]"
              >
                {t("logout")}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href="/profile"
                className="flex items-center gap-1.5 hover:text-[#C8A96B] transition-colors"
              >
                <User size={13} className="text-[#C8A96B]" />
                <span className="uppercase font-bold">{t("profile")}</span>
              </Link>
              <span className="w-[1px] h-3 bg-white/20" />
              <Link
                href="/login"
                className="flex items-center gap-1.5 hover:text-[#C8A96B] transition-colors"
              >
                <LogIn size={13} className="text-[#C8A96B]" />
                <span className="uppercase font-bold">{t("login")}</span>
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-1.5 hover:text-[#C8A96B] transition-colors"
              >
                <UserPlus size={13} className="text-[#C8A96B]" />
                <span className="uppercase font-bold">{t("register")}</span>
              </Link>
            </div>
          )}

          {/* Admin Portal — only visible to users with admin role */}
          {mounted && role === "admin" && (
            <>
              <span className="w-[1px] h-3.5 bg-white/20" />
              <Link
                href="/admin/"
                className="flex items-center gap-1.5 hover:text-[#C8A96B] transition-colors uppercase font-bold"
              >
                <ShieldCheck size={13} className="text-[#C8A96B]" />
                {t("portal")}
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

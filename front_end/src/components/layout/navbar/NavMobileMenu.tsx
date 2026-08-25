"use client";

import * as React from "react";
import { Link, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { ChevronDown, User, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { usePatientAuth } from "@/context/PatientAuthContext";
import { useNavItems } from "./NavbarConstants";
import { getUserRole, type UserRole } from "@/lib/api/auth";

interface NavMobileMenuProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  mounted: boolean;
}

export function NavMobileMenu({
  isOpen,
  setIsOpen,
  mounted,
}: NavMobileMenuProps) {
  const [mobileBranchesOpen, setMobileBranchesOpen] = React.useState(false);
  const [role, setRole] = React.useState<UserRole | null>(null);
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const navItems = useNavItems();

  const {
    patientUser,
    isAuthenticated: patientIsAuthenticated,
    logout: patientLogout,
  } = usePatientAuth();

  // Read role once on mount (client-only)
  React.useEffect(() => {
    setRole(getUserRole());
  }, [patientIsAuthenticated]);

  const roleBadge: Record<UserRole, { label: string; color: string }> = {
    admin: { label: "Admin", color: "#E53E3E" },
    doctor: { label: "Doctor", color: "#38A169" },
    patient: { label: "Patient", color: "#C8A96B" },
  };

  const [openDropdowns, setOpenDropdowns] = React.useState<Record<string, boolean>>({});

  const toggleDropdown = (href: string) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [href]: !prev[href],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="border-t border-slate-100 bg-white shadow-md lg:hidden absolute top-full left-0 right-0 z-30">
      <div className="flex flex-col p-4 max-h-[80vh] overflow-y-auto">
        <div className="grid grid-cols-1 gap-1">
          {navItems.map((item) => {
            if (item.hasDropdown) {
              const isAnySubActive = item.subItems?.some(
                (sub) => pathname === sub.href,
              );
              const isDropdownOpen = !!openDropdowns[item.href];

              return (
                <div key={item.href} className="flex flex-col">
                  <button
                    onClick={() => toggleDropdown(item.href)}
                    className={`flex items-center justify-between text-[13px] font-bold uppercase tracking-wider py-3 px-4 rounded-md text-left w-full ${
                      isAnySubActive
                        ? "bg-[#F8F9FA] text-primary border-l-4 border-accent"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>{item.label}</span>
                    <ChevronDown
                      size={14}
                      className={`transform transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isDropdownOpen && (
                    <div className="flex flex-col pl-4 pr-4 border-l border-slate-100 ml-6 gap-1 mt-1 mb-2">
                      {item.subItems?.map((sub) => {
                        const isSubActive = pathname === sub.href;
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            onClick={() => setIsOpen(false)}
                            className={`text-[12px] font-bold uppercase tracking-wider transition-colors py-2.5 px-3 rounded-md ${
                              isSubActive
                                ? "text-primary bg-slate-50 border-l-2 border-accent"
                                : "text-slate-500 hover:text-primary hover:bg-slate-50"
                            }`}
                          >
                            {sub.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`text-[13px] font-bold uppercase tracking-wider transition-colors py-3 px-4 rounded-md ${
                  isActive
                    ? "bg-[#F8F9FA] text-primary border-l-4 border-accent"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          {/* GCC IV Therapy Link — standalone route, uses <a> not next-intl Link */}
          <a
            href="/gcc/iv-therapy/ar"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 text-[13px] font-bold uppercase tracking-wider py-3 px-4 rounded-md text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors"
          >
            <Sparkles size={15} className="text-amber-600 shrink-0" />
            <span className="flex-1">{t("gcc")}</span>
            <span
              className="text-[9px] font-black px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: "#C8A96B22",
                color: "#92650a",
                border: "1px solid #C8A96B55",
              }}
            >
              {t("gccBadge")}
            </span>
          </a>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 mt-4 pt-4">
          {mounted && patientIsAuthenticated ? (
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 px-4 py-3 rounded-md">
              {role === "admin" ? (
                <div className="flex items-center gap-2 text-[13px] font-bold text-primary">
                  <User size={15} className="text-accent" />
                  <span>
                    {t("welcomeHi")}
                    {patientUser?.first_name || patientUser?.username}
                  </span>
                  {/* Role badge */}
                  {roleBadge[role] && (
                    <span
                      className="px-1.5 py-0.5 rounded text-[9px] font-black tracking-widest"
                      style={{
                        backgroundColor: roleBadge[role].color + "22",
                        color: roleBadge[role].color,
                      }}
                    >
                      {roleBadge[role].label}
                    </span>
                  )}
                </div>
              ) : (
                <Link
                  href="/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 text-[13px] font-bold text-primary hover:text-accent transition-colors"
                >
                  <User size={15} className="text-accent" />
                  <span>
                    {t("welcomeHi")}
                    {patientUser?.first_name || patientUser?.username}
                  </span>
                  {/* Role badge */}
                  {role && roleBadge[role] && (
                    <span
                      className="px-1.5 py-0.5 rounded text-[9px] font-black tracking-widest"
                      style={{
                        backgroundColor: roleBadge[role].color + "22",
                        color: roleBadge[role].color,
                      }}
                    >
                      {roleBadge[role].label}
                    </span>
                  )}
                </Link>
              )}
              <button
                onClick={() => {
                  setIsOpen(false);
                  patientLogout();
                }}
                className="text-[11px] font-black text-red-500 hover:text-red-700 transition-colors uppercase"
              >
                {t("logout")}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 text-[12px] font-bold text-center text-primary border border-primary/30 py-2.5 rounded-md hover:bg-slate-50 uppercase transition-colors"
              >
                <User size={14} className="text-accent" />
                {t("profile")}
              </Link>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="text-[12px] font-bold text-center text-slate-600 border border-slate-200 hover:border-primary py-2.5 rounded-md hover:bg-slate-50 uppercase"
                >
                  {t("login")}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsOpen(false)}
                  className="text-[12px] font-bold text-center text-white bg-primary py-2.5 rounded-md uppercase"
                >
                  {t("register")}
                </Link>
              </div>
            </div>
          )}

          {/* Admin Portal — only visible to users with admin role */}
          {mounted && role === "admin" && (
            <a
              href="/admin/"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-2 text-[12px] font-bold text-red-600 py-3 bg-red-50 rounded-md border border-red-200 uppercase mt-1 hover:bg-red-100 transition-colors"
            >
              <ShieldCheck size={14} className="text-red-500" />
              {t("portal")}
            </a>
          )}

          <Button
            asChild
            className="w-full rounded-lg bg-accent text-white hover:bg-primary py-3.5 mt-2 shadow-lg hover:shadow-md transition-all duration-300 uppercase font-bold tracking-widest hover:-translate-y-0.5"
          >
            <Link href="/book-appointment" onClick={() => setIsOpen(false)}>
              {t("book")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

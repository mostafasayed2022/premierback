"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import axios from "axios";
import { savePatientToken, clearAllTokens } from "@/lib/api/auth";
import { useRouter } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { toast } from "sonner";

interface PatientUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone_number: string;
}

interface PatientAuthContextValue {
  patientUser: PatientUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    phoneNumber: string;
    firstName?: string;
    lastName?: string;
  }) => Promise<void>;
  logout: (options?: { redirect?: boolean; message?: string } | any) => void;
}

const PatientAuthContext = createContext<PatientAuthContextValue | null>(null);

function getApiUrl(path: string): string {
  const raw = (
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api.premierhealthclinics.com/api"
  )
    .trim()
    .replace(/\/+$/, "");
  const apiBase = raw.endsWith("/api") ? raw : `${raw}/api`;
  let cleanPath = path.replace(/^\/+/, "");
  if (cleanPath.startsWith("api/")) {
    cleanPath = cleanPath.substring(4);
  }
  return `${apiBase}/${cleanPath}`;
}

export function PatientAuthProvider({ children }: { children: ReactNode }) {
  const [patientUser, setPatientUser] = useState<PatientUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const locale = useLocale();

  // Restore session from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("patient_access");
      const storedUser = localStorage.getItem("patient_user");
      if (token && storedUser) {
        try {
          setPatientUser(JSON.parse(storedUser));
          // Re-sync cookie in case it was cleared (e.g. browser restart)
          savePatientToken(token);
        } catch {
          clearAllTokens();
        }
      }
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    async (emailOrUsername: string, password: string) => {
      const { data } = await axios.post(getApiUrl("token/"), {
        username: emailOrUsername,
        password,
      });

      if (data.access && data.user) {
        // Persist to localStorage AND cookie (for server middleware)
        savePatientToken(data.access);
        localStorage.setItem("patient_refresh", data.refresh);
        localStorage.setItem("patient_user", JSON.stringify(data.user));
        setPatientUser(data.user);
      }
    },
    [],
  );

  const register = useCallback(
    async (payload: {
      email: string;
      password: string;
      phoneNumber: string;
      firstName?: string;
      lastName?: string;
    }) => {
      // 1. Submit registration
      await axios.post(getApiUrl("auth/register/"), {
        email: payload.email,
        password: payload.password,
        phone_number: payload.phoneNumber,
        first_name: payload.firstName || "",
        last_name: payload.lastName || "",
      });

      // 2. Perform silent login after successful registration
      await login(payload.email, payload.password);
    },
    [login],
  );

  const logout = useCallback(
    (options?: { redirect?: boolean; message?: string } | any) => {
      clearAllTokens();
      setPatientUser(null);

      const defaultMessages: Record<string, string> = {
        ar: "تم تسجيل الخروج بنجاح",
        en: "You have been logged out successfully",
        de: "Erfolgreich abgemeldet",
        fr: "Déconnexion réussie",
        it: "Disconnessione riuscita",
        es: "Has cerrado sesión correctamente",
        ru: "Вы успешно вышли из системы",
        tr: "Başarıyla çıkış yapıldı",
      };

      const isEvent =
        options &&
        (typeof options.preventDefault === "function" ||
          options.nativeEvent !== undefined);
      const opts = isEvent ? undefined : options;

      const msg =
        opts?.message || defaultMessages[locale] || defaultMessages.ar;
      toast.success(msg);

      if (opts?.redirect !== false) {
        router.push("/");
      }
    },
    [locale, router],
  );

  return (
    <PatientAuthContext.Provider
      value={{
        patientUser,
        isAuthenticated: patientUser !== null,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </PatientAuthContext.Provider>
  );
}

export function usePatientAuth(): PatientAuthContextValue {
  const ctx = useContext(PatientAuthContext);
  if (!ctx) {
    throw new Error("usePatientAuth must be used within <PatientAuthProvider>");
  }
  return ctx;
}

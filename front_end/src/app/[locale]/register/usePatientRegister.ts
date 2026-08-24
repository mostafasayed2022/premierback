// hooks/usePatientRegister.ts
"use client";

import React, { useState, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { usePatientAuth } from "@/context/PatientAuthContext";
import { toast } from "sonner";
import axios from "axios";
import { registerSchema, type RegisterFormData } from "@/lib/validations/auth";
import { ZodError } from "zod";

import { getErrorMessage } from "@/lib/utils/error";

export function usePatientRegister() {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const { register, isAuthenticated } = usePatientAuth();

  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, router, redirectTo]);

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof RegisterFormData, string>>
  >({});
  const [formError, setFormError] = useState("");
  const [registerForm, setRegisterForm] = useState<RegisterFormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
  });

  // ── Update field and clear its error ───────────────────────
  const updateField = useCallback(
    (field: keyof RegisterFormData, value: string) => {
      setRegisterForm((prev) => ({ ...prev, [field]: value }));
      // Clear field-level error when user types
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
      // Clear form-level error
      setFormError("");
    },
    [],
  );

  // ── Handle registration ────────────────────────────────────
  const handleRegister = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      setErrors({});
      setFormError("");

      // Validate with Zod
      try {
        registerSchema.parse(registerForm);
      } catch (err) {
        if (err instanceof ZodError) {
          const fieldErrors: Partial<Record<keyof RegisterFormData, string>> =
            {};

          err.issues.forEach((issue) => {
            const field = issue.path[0] as keyof RegisterFormData | undefined;
            if (field && !fieldErrors[field]) {
              fieldErrors[field] = issue.message;
            }
          });

          setErrors(fieldErrors);
          const firstError = err.issues[0]?.message || "Validation failed.";
          toast.error(firstError);
          return;
        }
        // Re-throw if it's not a ZodError (shouldn't happen with parse)
        throw err;
      }

      setLoading(true);

      try {
        await register({
          email: registerForm.email,
          password: registerForm.password,
          phoneNumber: registerForm.phone,
          firstName: registerForm.firstName,
          lastName: registerForm.lastName,
        });
        toast.success(t("registerSuccess") || "Account created successfully!");
        router.push(`/login?redirect=${encodeURIComponent(redirectTo)}`);
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === "object") {
          const data = err.response.data as Record<string, any>;
          const fieldErrors: Partial<Record<keyof RegisterFormData, string>> = {};
          if (data.email) fieldErrors.email = Array.isArray(data.email) ? data.email[0] : data.email;
          if (data.phone || data.phoneNumber) fieldErrors.phone = Array.isArray(data.phone) ? data.phone[0] : data.phone || data.phoneNumber;
          if (data.password) fieldErrors.password = Array.isArray(data.password) ? data.password[0] : data.password;
          if (data.firstName) fieldErrors.firstName = Array.isArray(data.firstName) ? data.firstName[0] : data.firstName;
          if (data.lastName) fieldErrors.lastName = Array.isArray(data.lastName) ? data.lastName[0] : data.lastName;
          if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
          }
        }

        const message = getErrorMessage(
          err,
          isAr
            ? "تعذر إنشاء الحساب، يرجى المحاولة مرة أخرى."
            : "Registration failed. Please try again.",
        );
        setFormError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [registerForm, register, router, t, isAr, redirectTo],
  );

  return {
    isAr,
    loading,
    registerForm,
    setRegisterForm: updateField,
    handleRegister,
    showPassword,
    setShowPassword,
    errors,
    formError,
    t,
  };
}

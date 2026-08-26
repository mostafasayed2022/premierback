// ─── events.ts ────────────────────────────────────────────────────────────────
// Typed analytics event functions for Premier Health Clinics
// All events use pushDataLayer — Zero-PII guaranteed by sanitizer layer.

import { pushDataLayer } from "./dataLayer";
import type {
  ViewServiceParams,
  SelectBranchParams,
  ViewBranchParams,
  ClickMapParams,
  ClickWhatsAppParams,
  ClickCallParams,
  StartBookingParams,
  SubmitLeadParams,
  BookingCompleteParams,
  AppointmentAttendedParams,
  PurchaseParams,
} from "./types";

// Helper to extract locale from window.location.pathname if omitted
function getClientLocale(override?: string): string | undefined {
  if (override) return override;
  if (typeof window === "undefined") return undefined;
  const match = window.location.pathname.match(/^\/(en|ar|fr|de|es|it|tr|ru)(\/|$)/);
  return match ? match[1] : undefined;
}

function getClientPathname(override?: string): string | undefined {
  if (override) return override;
  if (typeof window === "undefined") return undefined;
  return window.location.pathname;
}

// ─── 1. view_service ──────────────────────────────────────────────────────────
/** Fire when a service detail page is viewed (NOT on card mount). */
export function trackViewService(params: ViewServiceParams): void {
  pushDataLayer("view_service", {
    service_id: params.service_id,
    service_name: params.service_name,
    service_category: params.service_category,
    page_path: getClientPathname(params.page_path),
    locale: getClientLocale(params.locale),
  });
}

// ─── 2. select_branch ────────────────────────────────────────────────────────
/** Fire when a user selects a branch (booking wizard step 3 or branch page). */
export function trackSelectBranch(params: SelectBranchParams): void {
  pushDataLayer("select_branch", {
    branch_id: params.branch_id,
    branch_name: params.branch_name,
    page_path: getClientPathname(params.page_path),
    service_name: params.service_name,
    locale: getClientLocale(params.locale),
  });
}

// ─── 3. view_branch ──────────────────────────────────────────────────────────
/** Fire when a branch detail page is viewed (NOT on card mount). */
export function trackViewBranch(params: ViewBranchParams): void {
  pushDataLayer("view_branch", {
    branch_id: params.branch_id,
    branch_name: params.branch_name,
    page_path: getClientPathname(params.page_path),
    locale: getClientLocale(params.locale),
  });
}

// ─── 4. click_map ────────────────────────────────────────────────────────────
/** Fire when a user clicks a map link/button for a branch. */
export function trackClickMap(params: ClickMapParams): void {
  pushDataLayer("click_map", {
    branch_id: params.branch_id,
    branch_name: params.branch_name,
    location: params.location,
    page_path: getClientPathname(params.page_path),
    locale: getClientLocale(params.locale),
  });
}

// ─── 5. click_whatsapp ───────────────────────────────────────────────────────
/** Fire when a user clicks any WhatsApp CTA. NEVER include phone numbers. */
export function trackClickWhatsApp(params: ClickWhatsAppParams): void {
  pushDataLayer("click_whatsapp", {
    location: params.location ?? getClientPathname(params.page_path),
    page_path: getClientPathname(params.page_path),
    service_name: params.service_name,
    branch_name: params.branch_name,
    phone_type: params.phone_type,
    cta_position: params.cta_position,
    locale: getClientLocale(params.locale),
  });
}

// ─── 6. click_call ───────────────────────────────────────────────────────────
/** Fire when a user clicks any phone/call CTA. NEVER include phone numbers. */
export function trackClickCall(params: ClickCallParams): void {
  pushDataLayer("click_call", {
    location: params.location ?? getClientPathname(params.page_path),
    page_path: getClientPathname(params.page_path),
    service_name: params.service_name,
    branch_name: params.branch_name,
    phone_type: params.phone_type,
    cta_position: params.cta_position,
    locale: getClientLocale(params.locale),
  });
}

// ─── 7. start_booking ────────────────────────────────────────────────────────
/** Fire when user meaningfully begins the booking flow (step transition, not mount). */
export function trackStartBooking(params: StartBookingParams = {}): void {
  pushDataLayer("start_booking", {
    service_id: params.service_id,
    service_name: params.service_name,
    branch_id: params.branch_id,
    branch_name: params.branch_name,
    booking_source: params.booking_source ?? "website",
    page_path: getClientPathname(params.page_path),
    locale: getClientLocale(params.locale),
  });
}

// ─── 8. submit_lead ──────────────────────────────────────────────────────────
/**
 * Fire when user reaches contact/lead submission step with valid info.
 * NEVER include email, phone, or any PII.
 */
export function trackSubmitLead(params: SubmitLeadParams): void {
  pushDataLayer("submit_lead", {
    lead_type: params.lead_type ?? "booking",
    service_name: params.service_name,
    branch_name: params.branch_name,
    source: params.source ?? "booking_wizard",
    page_path: getClientPathname(params.page_path),
    locale: getClientLocale(params.locale),
  });
}

// ─── 9. booking_complete ─────────────────────────────────────────────────────
/**
 * Fire ONLY after confirmed successful booking API response (201).
 * Never fire on API failure.
 */
export function trackBookingComplete(params: BookingCompleteParams): void {
  pushDataLayer("booking_complete", {
    booking_id: params.booking_id,
    service_id: params.service_id,
    service_name: params.service_name,
    branch_id: params.branch_id,
    branch_name: params.branch_name,
    value: params.value,
    currency: params.currency ?? "EGP",
    page_path: getClientPathname(params.page_path),
    locale: getClientLocale(params.locale),
  });
}

// ─── 10. appointment_attended ────────────────────────────────────────────────
/**
 * Backend/admin-driven event.
 * Fire only when patient physically attended — NOT when booking is created/confirmed.
 */
export function trackAppointmentAttended(params: AppointmentAttendedParams): void {
  pushDataLayer("appointment_attended", {
    booking_id: params.booking_id,
    service_id: params.service_id,
    branch_id: params.branch_id,
    value: params.value,
    currency: params.currency ?? "EGP",
    page_path: getClientPathname(params.page_path),
    locale: getClientLocale(params.locale),
  });
}

// ─── 11. purchase ────────────────────────────────────────────────────────────
/**
 * Fire only after confirmed payment success (Paymob webhook → backend → frontend).
 * Deduplicated with stable transaction_id / booking_id.
 */
export function trackPurchase(params: PurchaseParams): void {
  pushDataLayer("purchase", {
    transaction_id: params.transaction_id,
    booking_id: params.booking_id,
    service_name: params.service_name,
    branch_name: params.branch_name,
    value: params.value,
    currency: params.currency,
    page_path: getClientPathname(params.page_path),
    locale: getClientLocale(params.locale),
  });
}

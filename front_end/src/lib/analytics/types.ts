// ─── Analytics Types ────────────────────────────────────────────────────────
// Zero-PII analytics architecture for Premier Health Clinics
// NEVER include: name, email, phone, address, medical info, national_id, dob

// ─── Attribution ─────────────────────────────────────────────────────────────

export interface Attribution {
  // UTM parameters
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;

  // Campaign IDs
  campaign_id?: string;
  adset_id?: string;
  ad_id?: string;

  // Google click IDs
  gclid?: string;
  gbraid?: string;
  wbraid?: string;

  // Platform click IDs
  fbclid?: string;
  ttclid?: string;
  scclid?: string;
  sc_click_id?: string;

  // Attribution meta
  landing_page?: string;
  referrer?: string;
}

export const FIRST_TOUCH_KEY = "premier_first_touch_attribution";
export const LAST_TOUCH_KEY = "premier_utm_attribution";
export const FIRST_TOUCH_TTL_DAYS = 30;
export const LAST_TOUCH_TTL_DAYS = 7;

export interface StoredAttribution extends Attribution {
  _stored_at: number;
  _expires_at: number;
}

// ─── Event Parameter Types ────────────────────────────────────────────────────

export interface ViewServiceParams {
  service_id: string | number;
  service_name: string;
  service_category?: string;
  page_path?: string;
  locale?: string;
}

export interface SelectBranchParams {
  branch_id: string | number;
  branch_name: string;
  page_path?: string;
  service_name?: string;
  locale?: string;
}

export interface ViewBranchParams {
  branch_id: string | number;
  branch_name: string;
  page_path?: string;
  locale?: string;
}

export interface ClickMapParams {
  branch_id: string | number;
  branch_name: string;
  location?: string;
  page_path?: string;
  locale?: string;
}

export interface ClickWhatsAppParams {
  location?: string;
  page_path?: string;
  service_name?: string;
  branch_name?: string;
  phone_type?: string;
  cta_position?: string;
  locale?: string;
}

export interface ClickCallParams {
  location?: string;
  page_path?: string;
  service_name?: string;
  branch_name?: string;
  phone_type?: string;
  cta_position?: string;
  locale?: string;
}

export interface StartBookingParams {
  service_id?: string | number;
  service_name?: string;
  branch_id?: string | number;
  branch_name?: string;
  booking_source?: string;
  page_path?: string;
  locale?: string;
}

export interface SubmitLeadParams {
  lead_type?: string;
  service_name?: string;
  branch_name?: string;
  source?: string;
  page_path?: string;
  locale?: string;
}

export interface BookingCompleteParams {
  booking_id: string | number;
  service_id?: string | number;
  service_name?: string;
  branch_id?: string | number;
  branch_name?: string;
  value?: number;
  currency?: string;
  page_path?: string;
  locale?: string;
}

export interface AppointmentAttendedParams {
  booking_id: string | number;
  service_id?: string | number;
  branch_id?: string | number;
  value?: number;
  currency?: string;
  page_path?: string;
  locale?: string;
}

export interface PurchaseParams {
  transaction_id: string | number;
  booking_id?: string | number;
  service_name?: string;
  branch_name?: string;
  value: number;
  currency: string;
  page_path?: string;
  locale?: string;
}

// ─── DataLayer Event ──────────────────────────────────────────────────────────

export type AnalyticsEventName =
  | "view_service"
  | "select_branch"
  | "view_branch"
  | "click_map"
  | "click_whatsapp"
  | "click_call"
  | "start_booking"
  | "submit_lead"
  | "booking_complete"
  | "appointment_attended"
  | "purchase";

export interface DataLayerEvent {
  event: AnalyticsEventName | string;
  [key: string]: unknown;
}

// Augment Window for TypeScript
declare global {
  interface Window {
    dataLayer: DataLayerEvent[];
  }
}

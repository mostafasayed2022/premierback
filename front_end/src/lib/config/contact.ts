// ─── contact.ts ──────────────────────────────────────────────────────────────
// Centralized contact constants for Premier Health Clinics
// Single source of truth — never hardcode these in individual components.

export const CONTACT = {
  /** Fairmont Nile City branch phone */
  phone_fairmont: "+201111977705",
  phone_fairmont_display: "+20 11 11977705",

  /** Arkan Plaza (Sheikh Zayed) branch phone */
  phone_arkan: "+201111977713",
  phone_arkan_display: "+20 11 11977713",

  /** EDNC Sodic (New Cairo) branch phone */
  phone_sodic: "+201111977712",
  phone_sodic_display: "+20 11 11977712",

  /** Primary Egyptian general/concierge phone number */
  phone_eg: "+201200644663",
  /** UAE / GCC phone number */
  phone_uae: "+971501200313",

  /** WhatsApp — Egyptian number (international format, no +) */
  whatsapp_eg: "201200644663",
  /** WhatsApp — UAE number (international format, no +) */
  whatsapp_uae: "971501200313",

  /** Official inquiries & concierge email */
  email_info: "info@premierhealthclinics.com",
  email_concierge: "info@premierhealthclinics.com",

  /** WhatsApp full URLs */
  whatsapp_url_eg: "https://wa.me/201200644663",
  whatsapp_url_uae: "https://wa.me/971501200313",

  /** Tel links */
  tel_fairmont: "tel:+201111977705",
  tel_arkan: "tel:+201111977713",
  tel_sodic: "tel:+201111977712",
  tel_eg: "tel:+201200644663",
  tel_uae: "tel:+971501200313",
} as const;

export const BRANCHES = {
  fairmont: {
    id: "fairmont-nile-city",
    name: "Fairmont Nile City",
    name_ar: "فيرمونت نايل سيتي",
    area: "Central Cairo / Nile",
    area_ar: "وسط القاهرة / النيل",
    phone: "+20 11 11977705",
    phone_raw: "+201111977705",
    map_url:
      "https://www.google.com/maps/place/Premier+Health/@30.0719202,31.2275839,17z",
  },
  arkan: {
    id: "arkan-plaza",
    name: "Arkan Plaza – Sheikh Zayed",
    name_ar: "أركان بلازا – الشيخ زايد",
    area: "West Cairo / Sheikh Zayed",
    area_ar: "غرب القاهرة / الشيخ زايد",
    phone: "+20 11 11977713",
    phone_raw: "+201111977713",
    map_url:
      "https://www.google.com/maps/place/Arkan+Plaza/@30.0194029,31.0045291,17z",
  },
  sodic: {
    id: "ednc-sodic",
    name: "EDNC SODIC – Fifth Settlement",
    name_ar: "EDNC سوديك – التجمع الخامس",
    area: "New Cairo / Fifth Settlement",
    area_ar: "القاهرة الجديدة / التجمع الخامس",
    phone: "+20 11 11977712",
    phone_raw: "+201111977712",
    map_url:
      "https://www.google.com/maps?q=2G87+5RC+D+solutions,+Eastown,+New+Cairo+1",
  },
} as const;

export type BranchKey = keyof typeof BRANCHES;

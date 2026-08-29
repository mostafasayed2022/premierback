// ─── Core domain types ────────────────────────────────────────────────────────

export interface Doctor {
  id: string;
  name: string;
  name_ar: string;
  specialty: string;
  specialty_ar: string;
  position: string;
  position_ar: string;
  languages: string[];
  languages_ar: string[];
  experience: number;
  gender: "Male" | "Female";
  branch: string;
  branch_ar: string;
  slug: string;
  bio: string;
  bio_ar: string;
  photo: string;
  image_url?: string;
  certifications: string[];
  certifications_ar: string[];
  schedule: string[];
  rating: number;
  patients: number;
  education: string[];
  specializations: string[];
  effective_fee?: number;
}

export interface Department {
  id: string;
  name: string;
  name_ar: string;
  slug: string;
  doctorsCount: number;
  description: string;
  description_ar: string;
  photo: string; // ← the field your UI already reads
  image_url?: string; // ← new: raw API field, merged into photo
}

export interface Service {
  duration: any;
  id: string;
  name: string;
  name_ar: string;
  slug: string;
  photo: string; // ← UI reads this
  image_url?: string; // ← raw API field
  price: number;
  description: string;
  description_ar: string;
  ingredients?: string;
  ingredients_ar?: string;
  category: string;
  department_name?: string;
  department_slug?: string;
  benefits: string[];
  benefits_ar: string[];
  process: string[];
  process_ar: string[];
  faq: { q: string; q_ar: string; a: string; a_ar: string }[];
}
export interface Branch {
  id: string;
  name: string;
  name_ar: string;
  address: string;
  address_ar: string;
  phone: string;
  hours: string;
  hours_ar: string;
  mapEmbed: string;
  mapUrl: string;
  photo: string;
  image_url?: string;
  url?: string | null;
  map_url?: string | null;
  country: string;
  services: string[];
}

export interface WizardSlot {
  id: number;
  date: string; // "2024-11-20"
  weekday?: string; // "Monday", "Tuesday", etc.
  start_time: string; // "09:00:00"
  end_time: string; // "17:00:00"
  slot_duration_minutes?: number;
}

export interface GalleryItem {
  id: string;
  title: string;
  title_ar: string;
  category: "facility" | "treatment" | "equipment";
  image: string;
  video_url?: string | null;
  video_file_url?: string | null;
  media_type?: "image" | "video";
  images?: string[];
  description: string;
  description_ar: string;
  caption?: string;
  caption_ar?: string;
  branch_id?: number | string | null;
  branch_name?: string | null;
}

export interface BranchGalleryItem {
  id: string;
  branch_id: string | number;
  branch_name?: string;
  branch_name_ar?: string;
  title: string;
  title_ar: string;
  image: string;
  image_url?: string;
  description: string;
  description_ar: string;
  order?: number;
  is_active?: boolean;
}

export interface TestimonialItem {
  id: string;
  name: string;
  name_ar: string;
  role: string;
  role_ar: string;
  rating: number;
  text: string;
  text_ar: string;
  description?: string;
  description_ar?: string;
  image_url?: string | null;
  video_url?: string | null;
  video_file_url?: string | null;
}

export interface FileUpload {
  id: number;
  original_name: string;
  size: number;
  size_display: string;
  content_type: string;
  extension: string;
  url: string;
  created_at: string;
}
// ─── Booking type (for CreateBookingResult) ───────────────────────────────────

export interface Booking {
  id: string;
  patient: string;
  doctor: string;
  service: string;
  branch: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  fee: number;
  notes: string;
  created_at: string;
}

// ─── Re-export booking and profile types ──────────────────────────────────────
export * from "./booking";
export * from "./profile";
export { uploadFile } from "../api/endpoints";
export { useFileUpload } from "../api/hooks";

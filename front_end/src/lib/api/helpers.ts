// ─── Merge & Mapping Helpers ──────────────────────────────────────────────────
//
// These functions merge API responses with mock data to fill missing fields
// (photos, Arabic translations, etc.) during the transition period.

import type {
  Department,
  Doctor,
  Service,
  Branch,
  Appointment,
} from "@/lib/types";
import { MOCK_DEPARTMENTS } from "@/lib/mockData";
import { mapBookingStatus, mapPaymentStatus } from "@/lib/utils/bookingStatus";
import { getOptimizedImageUrl } from "@/lib/utils/image";

// ─── API Response Types ────────────────────────────────────────────

interface ApiDepartment {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  image_url: string | null;
  name_ar?: string;
  description_ar?: string;
}

interface ApiService {
  id: number;
  name: string;
  slug: string;
  description: string;
  duration_minutes: number;
  default_fee: number;
  image_url: string | null;
  name_ar?: string;
  description_ar?: string;
  department_slug?: string;
  department_name?: string;
  category?: string;
}

interface ApiBranch {
  id: number;
  name: string;
  address: string;
  city: string;
  phone: string;
  url: string | null;
  image_url: string | null;
  map_url?: string | null;
  name_ar?: string;
  address_ar?: string;
}

export interface ApiDoctor {
  patients?: number;
  experience?: number;
  languages?: any;
  id: number;
  name?: string;
  name_ar?: string;
  specialization?: string;
  specialty?: string;
  specialty_ar?: string;
  position?: string;
  position_ar?: string;
  bio?: string;
  bio_ar?: string;
  image_url?: string;
  photo?: string;
  effective_fee?: number;
  slug?: string;
}

interface ApiBooking {
  id: string;
  date: string;
  start_time: string;
  end_time?: string;
  fee: number;
  status: string;
  payment_status?: string;
  patient?: {
    user?: { first_name?: string; last_name?: string };
    phone_number?: string;
  };
  service?: {
    name: string;
    department?: { name: string };
  };
  branch?: { name: string };
  doctor?: {
    name?: string;
    user?: { first_name?: string; username?: string };
  };
}

// ─── Department Merge ─────────────────────────────────────────────────────────

export function mergeDept(d: ApiDepartment): Department {
  const fallbackMock = MOCK_DEPARTMENTS.find(
    (m) => m.slug === d.slug || String(m.id) === String(d.id),
  );
  const rawCount =
    (d as any).doctors_count ??
    (d as any).doctorsCount ??
    (Array.isArray((d as any).doctors) ? (d as any).doctors.length : 0);

  return {
    ...d,
    id: String(d.id),
    name_ar: d.name_ar || d.name,
    description_ar: d.description_ar || d.description,
    photo: getOptimizedImageUrl(
      d.image_url || fallbackMock?.photo || "/Departments/iv_theapy.webp",
      800,
    ),
    doctorsCount: rawCount,
  } as Department;
}

// ─── Service Merge ────────────────────────────────────────────────────────────

export function mergeSvc(s: ApiService): Service {
  const deptSlug = s.department_slug || s.category || "general";

  return {
    ...s,
    id: String(s.id),
    category: deptSlug,
    department_name: s.department_name || deptSlug,
    department_slug: deptSlug,
    price: s.default_fee ?? 150,
    duration: s.duration_minutes ?? 0,
    name_ar: s.name_ar || s.name,
    description_ar: s.description_ar || s.description,
    photo: getOptimizedImageUrl(
      s.image_url || "/Treatments/Detox.webp",
      600,
    ),
    benefits: [],
    benefits_ar: [],
    process: [],
    process_ar: [],
    faq: [],
  } as Service;
}
// ─── Branch Merge ─────────────────────────────────────────────────────────────

export function mergeBranch(b: ApiBranch): Branch {
  const finalMapUrl = b.url || b.map_url || "";

  return {
    ...b,
    id: String(b.id),
    name_ar: b.name_ar || b.name,
    address_ar: b.address_ar || b.address,
    photo: getOptimizedImageUrl(
      b.image_url || "/AboutPreview/about.webp",
      800,
    ),
    hours: "",
    hours_ar: "",
    mapEmbed: "",
    mapUrl: finalMapUrl,
    map_url: finalMapUrl,
    url: finalMapUrl,
    country: "",
    services: [],
  } as Branch;
}
// ─── Doctor Merge ─────────────────────────────────────────────────────────────

export function mergeDoc(d: ApiDoctor): Doctor {
  return {
    ...d,
    id: String(d.id),
    name: d.name || `Dr. ${d.id}`,
    name_ar: d.name_ar || d.name || "",
    specialty: d.specialization || d.specialty || "",
    specialty_ar: d.specialty_ar || d.specialization || "",
    position: d.position || "Medical Specialist",
    position_ar: d.position_ar || "أخصائي طبي",
    bio: d.bio || "",
    bio_ar: d.bio_ar || d.bio || "",
    photo: getOptimizedImageUrl(
      d.image_url || d.photo || "/hero/hero1.webp",
      600,
    ),
    effective_fee: d.effective_fee ?? 0,
    languages: d.languages
      ? typeof d.languages === "string"
        ? d.languages.split(",").map((s) => s.trim())
        : d.languages
      : ["English", "Arabic"],
    languages_ar: [],
    experience: d.experience ?? 10,
    gender: "Male" as const,
    branch: "",
    branch_ar: "",
    slug: d.slug || "",
    certifications: [],
    certifications_ar: [],
    schedule: [],
    rating: 5,
    patients: d.patients ?? 500,
    education: [],
    specializations: [],
  } as Doctor;
}

// ─── Booking Mapper ───────────────────────────────────────────────────────────

export function mapBooking(b: ApiBooking): Appointment {
  let customerName = "Patient";
  let customerPhone = "";
  if (typeof b.patient === "string") {
    customerName = b.patient;
  } else if (b.patient) {
    const p = b.patient as any;
    if (p.user) {
      customerName =
        `${p.user.first_name || ""} ${p.user.last_name || ""}`.trim() ||
        "Patient";
    }
    if (p.phone_number) {
      customerPhone = p.phone_number;
    }
  }

  let serviceName = "";
  let departmentName = "";
  if (typeof b.service === "string") {
    serviceName = b.service;
  } else if (b.service) {
    const s = b.service as any;
    serviceName = s.name || "";
    departmentName = s.department?.name || "";
  }

  let branchName = "";
  if (typeof b.branch === "string") {
    branchName = b.branch;
  } else if (b.branch) {
    const br = b.branch as any;
    branchName = br.name || "";
  }

  let doctorName = "Doctor";
  if (typeof b.doctor === "string") {
    doctorName = b.doctor;
  } else if (b.doctor) {
    const d = b.doctor as any;
    if (d.name) {
      doctorName = d.name;
    } else if (d.user) {
      doctorName = `Dr. ${d.user.first_name || d.user.username || ""}`;
    }
  }

  return {
    id: b.id,
    customerName,
    customerPhone,
    department: departmentName,
    service: serviceName,
    branch: branchName,
    doctor: doctorName,
    date: b.date,
    time: b.start_time,
    endTime: b.end_time,
    status: mapBookingStatus(b.status) as Appointment["status"],
    amount: b.fee,
    paymentStatus: mapPaymentStatus(
      b.payment_status ?? "pending",
    ) as Appointment["paymentStatus"],
    paymentMethod: "Online",
  };
}

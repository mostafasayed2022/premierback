// lib/api/endpoints.ts
import axios from "axios";
import type { Attribution } from "@/lib/analytics/types";

import type {
  Department,
  Doctor,
  Service,
  Branch,
  Appointment,
  Payment,
  WizardSlot,
  GalleryItem,
  BranchGalleryItem,
  TestimonialItem,
  FileUpload,
  PatientProfile,
  DoctorProfileDetails,
  PatientMedicalRecord,
  UpdatePatientPayload,
  UpdateDoctorPayload,
  DoctorProfileBooking,
} from "@/lib/types";
// mock data removed
import { api } from "./client";
import {
  mergeDept,
  mergeSvc,
  mergeBranch,
  mergeDoc,
  mapBooking,
  type ApiDoctor,
} from "./helpers";

// ─── API Response Types ─────────────────────────────────────────────

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
}

interface ApiBranch {
  id: number;
  name: string;
  address: string;
  city: string;
  phone: string;
  url: string | null;
  image_url: string | null;
  name_ar?: string;
  address_ar?: string;
}
interface ApiGalleryItem {
  id: number | string;
  title: string;
  title_ar: string;
  category: string;
  media_type?: "image" | "video";
  image_url?: string;
  image?: string;
  video_url?: string | null;
  video_file_url?: string | null;
  images?: string[];
  description: string;
  description_ar: string;
  caption?: string;
  caption_ar?: string;
}

interface ApiTestimonialItem {
  id: number | string;
  name: string;
  name_ar: string;
  role: string;
  role_ar: string;
  rating: number;
  text: string;
  text_ar: string;
  image_url?: string | null;
  video_url?: string | null;
  video_file_url?: string | null;
}

interface ApiBooking {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  fee: number;
  status: string;
  notes: string;
  created_at: string;
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

export interface CreateBookingPayload {
  doctor: number;
  service: number;
  branch: number;
  date: string;
  start_time: string;
  payment_method?: string;
  email?: string;
  phone?: string;
  /** Attribution data for campaign tracking — Zero-PII, never contains patient info */
  attribution?: Attribution;
}

export interface CreateBookingResult {
  booking: ApiBooking;
  payment_url: string;
}

export interface BookingStatusResponse {
  id: string;
  status: string;
  payment_status: string | null;
}

// ─── File Upload ──────────────────────────────────────────────────

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.premierhealthclinics.com/api/";

/** Upload a file to the backend /api/files/ to get a real DB integer PK. */
export const uploadFile = async (
  file: File,
  onProgress?: (percent: number) => void,
): Promise<FileUpload> => {
  const baseUrl = (
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api.premierhealthclinics.com/api/"
  )
    .replace(/\/api\/?$/, "")
    .replace(/\/+$/, "");

  const formData = new FormData();
  formData.append("file", file);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("patient_access") ||
        localStorage.getItem("admin_access") ||
        localStorage.getItem("access_token")
      : null;

  const { data } = await axios.post<FileUpload>(
    `${baseUrl}/api/files/`,
    formData,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          onProgress(
            Math.round((progressEvent.loaded * 100) / progressEvent.total),
          );
        }
      },
    },
  );

  return data;
};

// ─── Departments ──────────────────────────────────────────────────

// Public page (Departments page)
export const getDepartments = async (): Promise<Department[]> => {
  try {
    const { data } = await api.get<ApiDepartment[]>("wizard/departments/");
    return data.map(mergeDept);
  } catch {
    return [];
  }
};

// Department Details page
export const getDepartmentBySlug = async (
  slugOrId: string | number,
): Promise<Department | undefined> => {
  try {
    const { data } = await api.get<any>(`departments/${slugOrId}/departments/`);

    const deptData = Array.isArray(data) ? data[0] : data;
    if (!deptData) throw new Error("No department found");
    return mergeDept(deptData);
  } catch {
    const all = await getDepartments();
    return all.find(
      (d) => d.slug === String(slugOrId) || d.id === String(slugOrId),
    );
  }
};
// ─── Services ─────────────────────────────────────────────────────

// Services Page
export const getServices = async (): Promise<Service[]> => {
  try {
    const { data } = await api.get<ApiService[]>("wizard/services/");

    return data.map(mergeSvc);
  } catch {
    return [];
  }
};

// Service Details
export const getServiceBySlug = async (
  slug: string,
): Promise<Service | undefined> => {
  try {
    const { data } = await api.get<ApiService>(`services/${slug}/`);

    return mergeSvc(data);
  } catch {
    const all = await getServices();
    return all.find((s) => s.slug === slug);
  }
};
// Booking Wizard
export const getServicesByDepartment = async (
  departmentId: number,
): Promise<Service[]> => {
  try {
    const { data } = await api.get<ApiService[]>(
      `wizard/departments/${departmentId}/services/`,
    );

    return data.map(mergeSvc);
  } catch {
    return [];
  }
};

// ─── Branches ─────────────────────────────────────────────────────
// Branches Page
export const getBranches = async (): Promise<Branch[]> => {
  try {
    const { data } = await api.get<ApiBranch[]>("wizard/branches/");

    return data.map(mergeBranch);
  } catch {
    return [];
  }
};

// Booking Wizard
export const getBranchesByService = async (
  serviceId: number,
): Promise<Branch[]> => {
  try {
    const { data } = await api.get<ApiBranch[]>(
      `wizard/services/${serviceId}/branches/`,
    );

    return data.map(mergeBranch);
  } catch {
    return [];
  }
};
// ─── Gallery ──────────────────────────────────────────────────────

export const getGallery = async (): Promise<GalleryItem[]> => {
  try {
    const { data } = await api.get<ApiGalleryItem[]>("gallery/");
    return data.map((g) => ({
      id: String(g.id),
      title: g.title,
      title_ar: g.title_ar,
      category: (g.category || "facility") as GalleryItem["category"],
      image: g.image_url || g.image || "",
      video_url: g.video_url || null,
      video_file_url: g.video_file_url || null,
      media_type:
        g.media_type || (g.video_file_url || g.video_url ? "video" : "image"),
      images: g.images || [],
      description: g.description || "",
      description_ar: g.description_ar || "",
      caption: g.caption,
      caption_ar: g.caption_ar,
    }));
  } catch {
    return [];
  }
};

export const getBranchGallery = async (
  branchId?: string,
): Promise<BranchGalleryItem[]> => {
  try {
    const params =
      branchId && branchId !== "all" ? { branch_id: branchId } : {};
    const { data } = await api.get<any[]>("branch-galleries-public/", {
      params,
    });
    return data.map((g) => ({
      id: String(g.id),
      branch_id: String(g.branch_id || g.branch || ""),
      branch_name: g.branch_name || "",
      branch_name_ar: g.branch_name_ar || g.branch_name || "",
      title: g.title || "",
      title_ar: g.title_ar || g.title || "",
      image: g.image_url || g.image || "",
      image_url: g.image_url || g.image || "",
      description: g.description || "",
      description_ar: g.description_ar || g.description || "",
      order: g.order || 0,
      is_active: g.is_active ?? true,
    }));
  } catch {
    return [];
  }
};

// ─── Testimonials ─────────────────────────────────────────────────

export const getTestimonials = async (): Promise<TestimonialItem[]> => {
  try {
    const { data } = await api.get<ApiTestimonialItem[]>(
      "testimonials-public/",
    );
    if (!data || data.length === 0) {
      return [];
    }
    return data.map((t: any) => ({
      id: String(t.id),
      name: t.name || "",
      name_ar: t.name_ar || t.name || "",
      role: t.role || "",
      role_ar: t.role_ar || t.role || "",
      rating: Number(t.rating ?? 5),
      text: t.text || t.description || "",
      text_ar: t.text_ar || t.description_ar || t.text || t.description || "",
      description: t.description || t.text || "",
      description_ar:
        t.description_ar || t.text_ar || t.description || t.text || "",
      image_url: t.image_url || null,
      video_url: t.video_url || null,
      video_file_url: t.video_file_url || null,
    }));
  } catch {
    return [];
  }
};

// ─── Doctors ──────────────────────────────────────────────────────
// Doctors Page
export const getDoctors = async (filters?: {
  search?: string;
  department?: string;
  branch?: string;
}): Promise<Doctor[]> => {
  try {
    const { data } = await api.get<ApiDoctor[]>("wizard/doctors/", {
      params: filters,
    });

    return data.map(mergeDoc);
  } catch {
    return [];
  }
};
// Doctor Details Page
export const getDoctorBySlug = async (
  slugOrId: string | number,
): Promise<Doctor | undefined> => {
  try {
    const { data } = await api.get<any>(`doctors/${slugOrId}/doctors/`);
    const docData = Array.isArray(data) ? data[0] : data;
    if (!docData) throw new Error("No doctor found");
    return mergeDoc(docData);
  } catch {
    const all = await getDoctors();
    return all.find(
      (d) => d.slug === String(slugOrId) || String(d.id) === String(slugOrId),
    );
  }
};
// Booking Wizard
export const getDoctorsByBranch = async (
  branchId: number,
  serviceId?: number,
): Promise<Doctor[]> => {
  try {
    const params: Record<string, number> = {};

    if (serviceId) {
      params.service = serviceId;
    }

    const { data } = await api.get<ApiDoctor[]>(
      `wizard/branches/${branchId}/doctors/`,
      { params },
    );

    return data.map(mergeDoc);
  } catch {
    return [];
  }
};

// ─── Slots ────────────────────────────────────────────────────────

export const getAvailableSlots = async (params: {
  doctorId: string | number;
  branchId: string | number;
}): Promise<WizardSlot[]> => {
  try {
    const { data } = await api.get<WizardSlot[]>(
      `wizard/doctors/${params.doctorId}/slots/`,
      { params: { branch: params.branchId } },
    );
    return data;
  } catch {
    return [];
  }
};

// ─── Booking ──────────────────────────────────────────────────────

export const createBooking = async (
  payload: CreateBookingPayload,
): Promise<CreateBookingResult> => {
  const { data } = await api.post<CreateBookingResult>(
    "bookings/create/",
    payload,
  );
  return data;
};

export const getBookingStatus = async (
  bookingId: string,
): Promise<BookingStatusResponse> => {
  const { data } = await api.get<BookingStatusResponse>(
    `/bookings/${bookingId}/status/`,
  );
  return data;
};

export const cancelBooking = async (
  bookingId: string,
  reason?: string,
): Promise<any> => {
  const payload = reason
    ? { status: "cancelled", reason }
    : { status: "cancelled" };

  try {
    const { data } = await api.post(`bookings/${bookingId}/cancel/`, payload);
    return data;
  } catch {
    // Fallback: try PATCH on bookings/:id/
    try {
      const { data } = await api.patch(`bookings/${bookingId}/`, payload);
      return data;
    } catch {
      // Fallback: try PATCH on doctor/bookings/:id/
      const { data } = await api.patch(
        `doctor/bookings/${bookingId}/`,
        payload,
      );
      return data;
    }
  }
};

// ─── Legacy wrappers ──────────────────────────────────────────────

export const bookAppointment = async (
  appointmentData: Partial<Appointment>,
): Promise<Appointment> => {
  try {
    const { data } = await api.post<Appointment>(
      "appointments/",
      appointmentData,
    );
    return data;
  } catch {
    return {
      id: `ap-${Math.floor(100 + Math.random() * 900)}`,
      customerName: appointmentData.customerName || "Bespoke Guest",
      customerPhone: appointmentData.customerPhone || "",
      department: appointmentData.department || "",
      service: appointmentData.service || "",
      branch: appointmentData.branch || "",
      doctor: appointmentData.doctor || "",
      date: appointmentData.date || new Date().toISOString().split("T")[0],
      time: appointmentData.time || "10:00 AM",
      status: "Confirmed",
      amount: appointmentData.amount || 150,
      paymentStatus: appointmentData.paymentStatus || "Unpaid",
      paymentMethod: appointmentData.paymentMethod,
    };
  }
};

export const getAppointments = async (): Promise<Appointment[]> => {
  try {
    const { data } = await api.get<ApiBooking[] | { results: ApiBooking[] }>(
      "bookings/mine/",
    );

    const rows: ApiBooking[] = Array.isArray(data) ? data : data.results;

    if (!rows) throw new Error("Invalid response format");

    return rows.map(mapBooking);
  } catch {
    return [];
  }
};

export const getPayments = async (): Promise<Payment[]> => {
  try {
    const { data } = await api.get<Payment[]>("payments/");
    return data;
  } catch {
    return [];
  }
};

// ─── Admin Analytics Stats ────────────────────────────────────────

export interface AdminAnalytics {
  total_bookings: number;
  bookings_this_month: number;
  active_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  total_patients: number;
  total_doctors: number;
  total_departments: number;
  total_services: number;
  total_branches: number;
  total_staff: number;
  total_availability: number;
  total_revenue: number;
}

export interface AdminStatsResponse {
  analytics: AdminAnalytics;
  daily_bookings: { date: string; count: number }[];
  branch_bookings: { branch: string; count: number }[];
  doctor_bookings: { doctor: string; count: number }[];
  payment_stats: { status: string; count: number }[];
}

export const getAdminStats = async (): Promise<AdminStatsResponse> => {
  const { data } = await api.get<AdminStatsResponse>("admin/stats/");
  return data;
};

// ─── Profile Mock Data & Endpoints ─────────────────────────────────

let MOCK_PATIENT_RECORDS: PatientMedicalRecord[] = [
  {
    id: "rec-1",
    patientId: "pat-101",
    title: "Comprehensive Blood & Biomarker Analysis",
    category: "Lab Result",
    doctorName: "Dr. Elena Vance",
    date: "2026-05-10",
    fileUrl:
      "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    fileSize: "1.4 MB",
    notes:
      "Vitamin D levels normalized. Iron panel optimal. Recommended quarterly re-check.",
  },
  {
    id: "rec-2",
    patientId: "pat-101",
    title: "Bespoke Skin Radiance Prescription",
    category: "Prescription",
    doctorName: "Dr. Elena Vance",
    date: "2026-04-18",
    fileUrl:
      "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    fileSize: "680 KB",
    notes: "Topical Retinoid 0.05% + Custom Hyaluronic Acid Serum.",
  },
  {
    id: "rec-3",
    patientId: "pat-101",
    title: "Facial Skin Density & Collagen Scan",
    category: "Imaging",
    doctorName: "Dr. Marcus Thorne",
    date: "2026-02-02",
    fileUrl:
      "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    fileSize: "3.2 MB",
    notes:
      "Dermal density improved by 18% following 3 sessions of radiofrequency microneedling.",
  },
];

// ─── API response shapes (snake_case from Django) ────────────────────────────
interface ApiPatientProfile {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone_number: string;
  date_of_birth: string | null;
  gender: string;
  address: string;
  image_url: string | null;
  total_appointments: number;
  completed_visits: number;
}

interface ApiDoctorProfile {
  id: number;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  phone?: string;
  phone_number?: string;
  specialization?: string;
  specialty?: string;
  position?: string;
  consultation_fee?: number | string | null;
  bio: string;
  license_number: string;
  image_url: string | null;
  photo?: string | null;
  experience?: number | string;
  experience_years?: number | string;
  rating?: number | string;
  patients_treated?: number | string;
  patients_count?: number | string;
  patients?: number | string;
  total_patients?: number | string;
  languages?: string[] | string;
  branches_names: string[];
  branches_detail?: Array<{ id: number; name: string; city?: string }>;
  services_names: string[];
  availabilities?: Array<{
    id: number;
    weekday?: string;
    weekday_display?: string;
    start_time?: string;
    startTime?: string;
    endTime?: string;
    end_time?: string;
    slotDurationMinutes?: number;
    slot_duration_minutes?: number;
    branchName?: string;
    branch_name?: string;
    branchId?: number;
  }>;
  bookings?: Array<{
    id: string;
    patient_name: string;
    patient_phone: string;
    service_name: string;
    branch_name: string;
    date: string;
    start_time: string;
    end_time: string;
    status: string;
    fee: string;
    notes: string;
  }>;
}

function mapPatientProfile(raw: ApiPatientProfile): PatientProfile {
  return {
    id: String(raw.id),
    userId: String(raw.id),
    firstName: raw.first_name,
    lastName: raw.last_name,
    fullName: raw.full_name,
    email: raw.email,
    phone: raw.phone_number ?? "",
    dateOfBirth: raw.date_of_birth ?? "",
    gender: (raw.gender ?? "") as PatientProfile["gender"],
    // address:           raw.address ?? "",
    avatar: raw.image_url ?? "",
    totalAppointments: raw.total_appointments ?? 0,
    completedVisits: raw.completed_visits ?? 0,
  };
}

function mapDoctorProfile(raw: ApiDoctorProfile): DoctorProfileDetails {
  const bookings = (raw.bookings ?? []).map((b) => ({
    id: String(b.id),
    patientName: b.patient_name || "Patient",
    patientPhone: b.patient_phone || "",
    serviceName: b.service_name || "",
    branchName: b.branch_name || "",
    date: b.date || "",
    startTime: b.start_time || "",
    endTime: b.end_time || "",
    status: b.status || "Confirmed",
    fee: String(b.fee || ""),
    notes: b.notes || "",
  }));

  const availability = (raw.availabilities ?? []).map((a) => ({
    id: String(a.id),
    weekday: a.weekday_display || a.weekday || "",
    startTime: a.start_time || a.startTime || "",
    endTime: a.end_time || a.endTime || "",
    slotDurationMinutes: a.slot_duration_minutes ?? a.slotDurationMinutes ?? 30,
    branchName: a.branch_name || a.branchName,
    branchId: a.branchId ? String(a.branchId) : undefined,
  }));

  const rawExp = raw.experience_years ?? raw.experience;
  const expYears =
    rawExp !== undefined && rawExp !== null ? Number(rawExp) : 14;

  const rawRating = raw.rating;
  const ratingNum =
    rawRating !== undefined && rawRating !== null ? Number(rawRating) : 4.95;

  const rawPatients =
    raw.patients_treated ??
    raw.patients_count ??
    raw.patients ??
    raw.total_patients;
  const patientsCount =
    rawPatients !== undefined && rawPatients !== null
      ? Number(rawPatients)
      : bookings.length > 0
        ? bookings.length
        : 3000;

  return {
    id: String(raw.id),
    userId: String(raw.id),
    firstName: raw.first_name || "",
    lastName: raw.last_name || "",
    name:
      raw.name ||
      `${raw.first_name || ""} ${raw.last_name || ""}`.trim() ||
      "Doctor",
    email: raw.email || "",
    phone: raw.phone || raw.phone_number || "",
    specialization: raw.specialization || raw.specialty || "",
    specialty: raw.specialty || raw.specialization || "",
    position: raw.position ?? "",
    consultationFee: raw.consultation_fee
      ? Number(raw.consultation_fee)
      : undefined,
    bio: raw.bio || "",
    licenseNumber: raw.license_number ?? "",
    photo: raw.image_url || raw.photo || "",
    experienceYears: expYears,
    rating: ratingNum,
    patientsTreated: patientsCount,
    branches: raw.branches_names ?? [],
    branchesDetail: (raw.branches_detail ?? []).map((b) => ({
      id: b.id,
      name: b.name,
      city: b.city,
    })),
    services: raw.services_names ?? [],
    languages:
      typeof raw.languages === "string"
        ? raw.languages.split(",").map((s) => s.trim())
        : Array.isArray(raw.languages)
          ? raw.languages
          : ["Arabic", "English"],
    availability,
    bookings,
  };
}

// Patient Profile Endpoints
export const getPatientProfile = async (): Promise<PatientProfile> => {
  const { data } = await api.get<ApiPatientProfile>("profile/patient/");
  return mapPatientProfile(data);
};

export const updatePatientProfile = async (
  payload: UpdatePatientPayload,
): Promise<PatientProfile> => {
  // Map camelCase payload → snake_case for Django
  const body: Record<string, unknown> = {};
  if (payload.firstName !== undefined) body.first_name = payload.firstName;
  if (payload.lastName !== undefined) body.last_name = payload.lastName;
  if (payload.phone !== undefined) body.phone_number = payload.phone;
  if (payload.dateOfBirth !== undefined)
    body.date_of_birth = payload.dateOfBirth;
  if (payload.gender !== undefined) body.gender = payload.gender;
  // if (payload.address     !== undefined) body.address       = payload.address;

  // image_id: integer FK to the File model — sent after camera-button upload
  if (payload.imageId !== undefined) {
    body.image_id = payload.imageId;
    body.image = payload.imageId;
  }
  if (payload.avatar !== undefined) {
    body.avatar = payload.avatar;
    body.image_url = payload.avatar;
  }

  const { data } = await api.patch<ApiPatientProfile>("profile/patient/", body);
  return mapPatientProfile(data);
};

// Doctor Profile Endpoints
export const getMyDoctorProfile = async (): Promise<DoctorProfileDetails> => {
  const { data } = await api.get<ApiDoctorProfile>("profile/doctor/");
  return mapDoctorProfile(data);
};

export const updateDoctorProfile = async (
  payload: UpdateDoctorPayload,
): Promise<DoctorProfileDetails> => {
  const body: Record<string, unknown> = {};
  if (payload.firstName !== undefined) body.first_name = payload.firstName;
  if (payload.lastName !== undefined) body.last_name = payload.lastName;
  if (payload.specialization !== undefined)
    body.specialization = payload.specialization;
  if (payload.position !== undefined) body.position = payload.position;
  if (payload.licenseNumber !== undefined)
    body.license_number = payload.licenseNumber;
  if (payload.consultationFee !== undefined)
    body.consultation_fee = payload.consultationFee;
  if (payload.bio !== undefined) body.bio = payload.bio;

  // image_id: integer FK to the File model — set by the upload flow
  if (payload.imageId !== undefined) {
    body.image_id = payload.imageId;
    body.image = payload.imageId;
  }
  if (payload.photo !== undefined) {
    body.photo = payload.photo;
    body.image_url = payload.photo;
  }

  if (payload.availability !== undefined) {
    body.availabilities_data = payload.availability.map((a) => ({
      weekday: a.weekday,
      start_time: a.startTime,
      end_time: a.endTime,
      slot_duration_minutes: a.slotDurationMinutes,
      branch_name: a.branchName || "",
    }));
  }

  const { data } = await api.patch<ApiDoctorProfile>("profile/doctor/", body);
  return mapDoctorProfile(data);
};

export interface RescheduleBookingPayload {
  date: string;
  startTime: string;
  endTime: string;
}

export const rescheduleBooking = async (
  bookingId: string,
  payload: RescheduleBookingPayload,
): Promise<DoctorProfileBooking> => {
  const { data } = await api.patch<any>(`doctor/bookings/${bookingId}/`, {
    date: payload.date,
    start_time: payload.startTime,
    end_time: payload.endTime,
  });
  return {
    id: data.id,
    patientName: data.patient_name,
    patientPhone: data.patient_phone,
    serviceName: data.service_name,
    branchName: data.branch_name,
    date: data.date,
    startTime: data.start_time,
    endTime: data.end_time,
    status: data.status,
    fee: data.fee,
    notes: data.notes,
  };
};

export const getDoctorPublicProfile = async (
  id: string,
): Promise<DoctorProfileDetails> => {
  const { data } = await api.get<ApiDoctorProfile>(`doctors/${id}/`);
  return mapDoctorProfile(data);
};

// Patient Medical Records Endpoints
export const getPatientRecords = async (): Promise<PatientMedicalRecord[]> => {
  try {
    const { data } = await api.get<PatientMedicalRecord[]>("patient/records/");
    return data;
  } catch {
    return MOCK_PATIENT_RECORDS;
  }
};

export const addPatientRecord = async (
  payload: Omit<PatientMedicalRecord, "id" | "patientId" | "date"> & {
    date?: string;
  },
): Promise<PatientMedicalRecord> => {
  const { data } = await api.post<PatientMedicalRecord>(
    "patient/records/",
    payload,
  );
  MOCK_PATIENT_RECORDS = [data, ...MOCK_PATIENT_RECORDS];
  return data;
};

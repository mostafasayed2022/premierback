// ─── TanStack Query Hooks ─────────────────────────────────────────────────────
"use client";

import {
  useQuery,
  useMutation,
  type UseQueryOptions,
  type UseMutationOptions,
  type UseQueryResult,
  useQueryClient,
} from "@tanstack/react-query";
import { AxiosError } from "axios";

import type {
  Department,
  Doctor,
  Service,
  Branch,
  Appointment,
  Payment,
  WizardSlot,
  FileUpload,
  PatientProfile,
  DoctorProfileDetails,
  PatientMedicalRecord,
  UpdatePatientPayload,
  UpdateDoctorPayload,
  DoctorProfileBooking,
  GalleryItem,
  BranchGalleryItem,
  TestimonialItem,
} from "@/lib/types";

import {
  getDepartments,
  getDepartmentBySlug,
  getServices,
  getServiceBySlug,
  getBranches,
  getDoctors,
  getAvailableSlots,
  getGallery,
  getBranchGallery,
  getTestimonials,
  getAppointments,
  getPayments,
  bookAppointment,
  getBookingStatus,
  uploadFile,
  createBooking,
  getPatientProfile,
  updatePatientProfile,
  getMyDoctorProfile,
  updateDoctorProfile,
  getDoctorPublicProfile,
  getPatientRecords,
  addPatientRecord,
  getServicesByDepartment,
  getBranchesByService,
  getDoctorsByBranch,
  getDoctorBySlug,
  rescheduleBooking,
  cancelBooking,
  CreateBookingResult,
  CreateBookingPayload,
  RescheduleBookingPayload,
} from "./endpoints";
import { queryKeys, staleTime } from "./queryKeys";
export type {
  CreateBookingPayload,
  CreateBookingResult,
  BookingStatusResponse,
  RescheduleBookingPayload,
} from "./endpoints";

// ─── Centralized Error Class ──────────────────────────────────────────────────

export class ApiError extends Error {
  /** HTTP status code (e.g. 401, 404, 500) — undefined for network errors */
  public readonly statusCode?: number;
  /** Raw underlying error for debugging */
  public readonly originalError: unknown;
  /** Response body from server, if any */
  public readonly responseData?: unknown;
  status: number | undefined;

  constructor(
    message: string,
    options?: {
      statusCode?: number;
      originalError?: unknown;
      responseData?: unknown;
    },
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = options?.statusCode;
    this.originalError = options?.originalError;
    this.responseData = options?.responseData;
  }

  /** True for 401/403 errors */
  get isAuthError(): boolean {
    return this.statusCode === 401 || this.statusCode === 403;
  }

  /** True for 404 errors */
  get isNotFound(): boolean {
    return this.statusCode === 404;
  }

  /** True for 5xx server errors */
  get isServerError(): boolean {
    return !!this.statusCode && this.statusCode >= 500;
  }

  /** True for network/timeout errors (no HTTP response received) */
  get isNetworkError(): boolean {
    return this.statusCode === undefined;
  }
}

// ─── Error Normalizer ─────────────────────────────────────────────────────────

function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const serverMessage =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.response?.data?.error;

    return new ApiError(
      serverMessage || error.message || "An unexpected error occurred",
      {
        statusCode: status,
        originalError: error,
        responseData: error.response?.data,
      },
    );
  }

  if (error instanceof Error) {
    return new ApiError(error.message, { originalError: error });
  }

  return new ApiError("An unknown error occurred", { originalError: error });
}

// ─── Type-safe Query Wrapper ──────────────────────────────────────────────────

type QueryOpts<TData> = Omit<
  UseQueryOptions<TData, ApiError>,
  "queryKey" | "queryFn"
>;

// ═══════════════════════════════════════════════════════════════════════════════
// QUERY HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Departments ──────────────────────────────────────────────────────────────

export function useDepartments(
  options?: QueryOpts<Department[]>,
): UseQueryResult<Department[], ApiError> {
  return useQuery<Department[], ApiError>({
    queryKey: queryKeys.departments.all,
    queryFn: async () => {
      try {
        return await getDepartments();
      } catch (e) {
        throw normalizeError(e);
      }
    },
    staleTime: staleTime.departments,
    ...options,
  });
}

export function useDepartmentBySlug(
  slugOrId: string | number | undefined,
  options?: QueryOpts<Department | undefined>,
): UseQueryResult<Department | undefined, ApiError> {
  return useQuery<Department | undefined, ApiError>({
    queryKey: queryKeys.departments.bySlug(String(slugOrId ?? "")),
    queryFn: async () => {
      try {
        return await getDepartmentBySlug(slugOrId!);
      } catch (e) {
        throw normalizeError(e);
      }
    },
    enabled: !!slugOrId,
    staleTime: staleTime.departments,
    ...options,
  });
}

// ─── Services ─────────────────────────────────────────────────────────────────

export function useServices(
  options?: QueryOpts<Service[]>,
): UseQueryResult<Service[], ApiError> {
  return useQuery({
    queryKey: queryKeys.services.all,
    queryFn: async () => {
      try {
        return await getServices();
      } catch (e) {
        throw normalizeError(e);
      }
    },
    staleTime: staleTime.services,
    ...options,
  });
}

export function useServicesByDepartment(
  departmentId: number | undefined,
  options?: QueryOpts<Service[]>,
): UseQueryResult<Service[], ApiError> {
  return useQuery({
    queryKey: queryKeys.bookingServices.byDepartment(departmentId ?? ""),
    queryFn: async () => {
      try {
        return await getServicesByDepartment(departmentId!);
      } catch (e) {
        throw normalizeError(e);
      }
    },
    enabled: !!departmentId,
    staleTime: staleTime.services,
    ...options,
  });
}

export function useServiceBySlug(
  slug: string | undefined,
  options?: QueryOpts<Service | undefined>,
): UseQueryResult<Service | undefined, ApiError> {
  return useQuery<Service | undefined, ApiError>({
    queryKey: [...queryKeys.services.all, "bySlug", slug ?? ""],
    queryFn: async () => {
      try {
        return await getServiceBySlug(slug!);
      } catch (e) {
        throw normalizeError(e);
      }
    },
    enabled: !!slug,
    staleTime: staleTime.services,
    ...options,
  });
}

// ─── Branches ─────────────────────────────────────────────────────────────────

export function useBranches(
  options?: QueryOpts<Branch[]>,
): UseQueryResult<Branch[], ApiError> {
  return useQuery({
    queryKey: queryKeys.branches.all,
    queryFn: async () => {
      try {
        return await getBranches();
      } catch (e) {
        throw normalizeError(e);
      }
    },
    staleTime: staleTime.branches,
    ...options,
  });
}

export function useBranchesByService(
  serviceId: number | undefined,
  options?: QueryOpts<Branch[]>,
): UseQueryResult<Branch[], ApiError> {
  return useQuery({
    queryKey: queryKeys.bookingBranches.byService(serviceId ?? ""),
    queryFn: async () => {
      try {
        return await getBranchesByService(serviceId!);
      } catch (e) {
        throw normalizeError(e);
      }
    },
    enabled: !!serviceId,
    staleTime: staleTime.branches,
    ...options,
  });
}
// ─── Doctors ──────────────────────────────────────────────────────────────────

export function useDoctors(
  filters?: {
    search?: string;
    department?: string;
    branch?: string;
  },
  options?: QueryOpts<Doctor[]>,
): UseQueryResult<Doctor[], ApiError> {
  return useQuery<Doctor[], ApiError>({
    queryKey: queryKeys.doctors.filtered(filters),
    queryFn: async () => {
      try {
        return await getDoctors(filters);
      } catch (e) {
        throw normalizeError(e);
      }
    },
    staleTime: staleTime.doctors,
    ...options,
  });
}

export function useDoctorsByBranch(
  branchId: number | undefined,
  serviceId?: number,
  options?: QueryOpts<Doctor[]>,
): UseQueryResult<Doctor[], ApiError> {
  return useQuery<Doctor[], ApiError>({
    queryKey: queryKeys.bookingDoctors.byBranch(branchId ?? "", serviceId),
    queryFn: async () => {
      try {
        return await getDoctorsByBranch(branchId!, serviceId);
      } catch (e) {
        throw normalizeError(e);
      }
    },
    enabled: !!branchId,
    staleTime: staleTime.doctors,
    ...options,
  });
}

export function useDoctorBySlug(
  doctorIdOrSlug: string | number | undefined,
  options?: QueryOpts<Doctor | undefined>,
): UseQueryResult<Doctor | undefined, ApiError> {
  return useQuery<Doctor | undefined, ApiError>({
    queryKey: [
      ...queryKeys.doctors.all,
      "bySlug",
      String(doctorIdOrSlug ?? ""),
    ],
    queryFn: async () => {
      try {
        return (await getDoctorBySlug(doctorIdOrSlug!)) ?? undefined;
      } catch (e) {
        throw normalizeError(e);
      }
    },
    enabled: !!doctorIdOrSlug,
    staleTime: staleTime.doctors,
    ...options,
  });
}
// ─── Available Slots ──────────────────────────────────────────────────────────

export function useAvailableSlots(
  params: { doctorId?: string | number; branchId?: string | number },
  options?: QueryOpts<WizardSlot[]>,
): UseQueryResult<WizardSlot[], ApiError> {
  const enabled = !!params.doctorId && !!params.branchId;

  return useQuery<WizardSlot[], ApiError>({
    queryKey: queryKeys.slots.byDoctorAndBranch(
      params.doctorId ?? "",
      params.branchId ?? "",
    ),
    queryFn: async () => {
      try {
        return await getAvailableSlots({
          doctorId: params.doctorId!,
          branchId: params.branchId!,
        });
      } catch (e) {
        throw normalizeError(e);
      }
    },
    enabled,
    staleTime: staleTime.slots,
    ...options,
  });
}

// ─── Gallery ──────────────────────────────────────────────────────────────────

export function useGallery(
  options?: QueryOpts<GalleryItem[]>,
): UseQueryResult<GalleryItem[], ApiError> {
  return useQuery<GalleryItem[], ApiError>({
    queryKey: queryKeys.gallery.all,
    queryFn: async () => {
      try {
        return await getGallery();
      } catch (e) {
        throw normalizeError(e);
      }
    },
    staleTime: staleTime.gallery,
    ...options,
  });
}

export function useBranchGallery(
  branchId?: string,
  options?: QueryOpts<BranchGalleryItem[]>,
): UseQueryResult<BranchGalleryItem[], ApiError> {
  return useQuery<BranchGalleryItem[], ApiError>({
    queryKey: ["branch-gallery", branchId || "all"],
    queryFn: async () => {
      try {
        return await getBranchGallery(branchId);
      } catch (e) {
        throw normalizeError(e);
      }
    },
    staleTime: staleTime.gallery,
    ...options,
  });
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

// export function useTestimonials(
//   options?: QueryOpts<TestimonialItem[]>,
// ): UseQueryResult<TestimonialItem[], ApiError> {
//   return useQuery<TestimonialItem[], ApiError>({
//     queryKey: queryKeys.testimonials.all,
//     queryFn: async () => {
//       try {
//         return await getTestimonials();
//       } catch (e) {
//         throw normalizeError(e);
//       }
//     },
//     staleTime: staleTime.testimonials,
//     ...options,
//   });
// }

// ─── Appointments ─────────────────────────────────────────────────────────────

export function useAppointments(
  options?: QueryOpts<Appointment[]>,
): UseQueryResult<Appointment[], ApiError> {
  return useQuery<Appointment[], ApiError>({
    queryKey: queryKeys.appointments.all,
    queryFn: async () => {
      try {
        return await getAppointments();
      } catch (e) {
        throw normalizeError(e);
      }
    },
    staleTime: staleTime.appointments,
    ...options,
  });
}

// ─── Booking Status ───────────────────────────────────────────────────────────

export type BookingStatusResult = {
  id: string;
  status: string;
  payment_status: string | null;
};

export function useBookingStatus(
  bookingId: string | undefined,
  options?: QueryOpts<BookingStatusResult>,
): UseQueryResult<BookingStatusResult, ApiError> {
  return useQuery<BookingStatusResult, ApiError>({
    queryKey: queryKeys.bookingStatus.byId(bookingId ?? ""),
    queryFn: async () => {
      try {
        return await getBookingStatus(bookingId!);
      } catch (e) {
        throw normalizeError(e);
      }
    },
    enabled: !!bookingId,
    staleTime: staleTime.bookingStatus,
    ...options,
  });
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export function usePayments(
  options?: QueryOpts<Payment[]>,
): UseQueryResult<Payment[], ApiError> {
  return useQuery<Payment[], ApiError>({
    queryKey: queryKeys.payments.all,
    queryFn: async () => {
      try {
        return await getPayments();
      } catch (e) {
        throw normalizeError(e);
      }
    },
    staleTime: staleTime.payments,
    ...options,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// MUTATION HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── File Upload Mutation ──────────────────────────────────────────

export function useFileUpload(
  options?: Omit<
    UseMutationOptions<
      FileUpload,
      ApiError,
      {
        file: File;
        onProgress?: (percent: number) => void;
      },
      unknown
    >,
    "mutationFn"
  >,
) {
  return useMutation<
    FileUpload,
    ApiError,
    { file: File; onProgress?: (percent: number) => void }
  >({
    mutationFn: async ({ file, onProgress }) => {
      try {
        return await uploadFile(file, onProgress);
      } catch (e) {
        throw normalizeError(e);
      }
    },
    ...options,
  });
}

export function useCreateBooking(
  options?: Omit<
    UseMutationOptions<
      CreateBookingResult,
      ApiError,
      CreateBookingPayload,
      unknown
    >,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();

  return useMutation<CreateBookingResult, ApiError, CreateBookingPayload>({
    mutationFn: async (payload) => {
      try {
        return await createBooking(payload);
      } catch (e) {
        throw normalizeError(e);
      }
    },
    ...options, // ⚠️ Spread MUST be before onSuccess so we don't overwrite it
    onSuccess: (data, variables, context, onMutateResult) => {
      // تحديث الكاش تلقائياً
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
      // تشغيل الـ onSuccess المخصص
      options?.onSuccess?.(data, variables, context, onMutateResult);
    },
  });
}

// ─── Book Appointment (Legacy) ────────────────────────────────────────────────

export function useBookAppointment(
  options?: Omit<
    UseMutationOptions<Appointment, ApiError, Partial<Appointment>, unknown>,
    "mutationFn"
  >,
) {
  return useMutation<Appointment, ApiError, Partial<Appointment>>({
    mutationFn: async (data) => {
      try {
        return await bookAppointment(data);
      } catch (e) {
        throw normalizeError(e);
      }
    },
    ...options,
  });
}

// ─── Cancel Booking ──────────────────────────────────────────────────────────

export function useCancelBooking(
  options?: Omit<
    UseMutationOptions<
      any,
      ApiError,
      { bookingId: string; reason?: string },
      unknown
    >,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();

  return useMutation<any, ApiError, { bookingId: string; reason?: string }>({
    mutationFn: async ({ bookingId, reason }) => {
      try {
        return await cancelBooking(bookingId, reason);
      } catch (e) {
        throw normalizeError(e);
      }
    },
    ...options,
    onSuccess: (data, variables, context, onMutateResult) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.patientProfile.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.doctorProfile.me });
      import("sonner").then(({ toast }) => {
        toast.success("Visit has been cancelled successfully.");
      });
      options?.onSuccess?.(data, variables, context, onMutateResult);
    },
    onError: (err, variables, context, er) => {
      import("sonner").then(({ toast }) => {
        toast.error(err.message || "Failed to cancel appointment");
      });
      options?.onError?.(err, variables, context, er);
    },
  });
}
export function usePrefetchServices() {
  const queryClient = useQueryClient();

  return (departmentId: number) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.bookingServices.byDepartment(departmentId),
      queryFn: () => getServicesByDepartment(departmentId),
      staleTime: staleTime.services,
    });
  };
}

export function usePrefetchDoctors() {
  const queryClient = useQueryClient();

  return (branchId: number, serviceId?: number) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.bookingDoctors.byBranch(branchId, serviceId),
      queryFn: () => getDoctorsByBranch(branchId, serviceId),
      staleTime: staleTime.doctors,
    });
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROFILE & MEDICAL RECORDS HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Patient Profile Hooks ─────────────────────────────────────────────────────

export function usePatientProfile(
  options?: QueryOpts<PatientProfile>,
): UseQueryResult<PatientProfile, ApiError> {
  return useQuery<PatientProfile, ApiError>({
    queryKey: queryKeys.patientProfile.me,
    queryFn: async () => {
      try {
        return await getPatientProfile();
      } catch (e) {
        throw normalizeError(e);
      }
    },
    staleTime: staleTime.profiles,
    ...options,
  });
}

export function useUpdatePatientProfile(
  options?: Omit<
    UseMutationOptions<PatientProfile, ApiError, UpdatePatientPayload, unknown>,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();

  return useMutation<PatientProfile, ApiError, UpdatePatientPayload>({
    mutationFn: async (payload) => {
      try {
        return await updatePatientProfile(payload);
      } catch (e) {
        throw normalizeError(e);
      }
    },
    ...options,
    onSuccess: (data, variables, context, onMutateResult) => {
      queryClient.setQueryData(queryKeys.patientProfile.me, data);
      queryClient.invalidateQueries({ queryKey: queryKeys.patientProfile.me });
      import("sonner").then(({ toast }) => {
        if (
          variables?.imageId !== undefined ||
          variables?.avatar !== undefined
        ) {
          toast.success("Patient profile picture updated successfully!");
        }
      });
      options?.onSuccess?.(data, variables, context, onMutateResult);
    },
  });
}

// ─── Doctor Profile Hooks ──────────────────────────────────────────────────────

export function useMyDoctorProfile(
  options?: QueryOpts<DoctorProfileDetails>,
): UseQueryResult<DoctorProfileDetails, ApiError> {
  return useQuery<DoctorProfileDetails, ApiError>({
    queryKey: queryKeys.doctorProfile.me,
    queryFn: async () => {
      try {
        return await getMyDoctorProfile();
      } catch (e) {
        throw normalizeError(e);
      }
    },
    staleTime: staleTime.profiles,
    ...options,
  });
}

export function useUpdateDoctorProfile(
  options?: Omit<
    UseMutationOptions<
      DoctorProfileDetails,
      ApiError,
      UpdateDoctorPayload,
      unknown
    >,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();

  return useMutation<DoctorProfileDetails, ApiError, UpdateDoctorPayload>({
    mutationFn: async (payload) => {
      try {
        return await updateDoctorProfile(payload);
      } catch (e) {
        throw normalizeError(e);
      }
    },
    ...options,
    onSuccess: (data, variables, context, onMutateResult) => {
      queryClient.setQueryData(queryKeys.doctorProfile.me, data);
      queryClient.invalidateQueries({ queryKey: queryKeys.doctorProfile.me });
      import("sonner").then(({ toast }) => {
        if (
          variables?.imageId !== undefined ||
          variables?.photo !== undefined
        ) {
          toast.success("Doctor profile picture updated successfully!");
        } else if (variables?.availability !== undefined) {
          toast.success("Profile schedule saved successfully!");
        } else {
          toast.success("Doctor profile updated successfully!");
        }
      });
      options?.onSuccess?.(data, variables, context, onMutateResult);
    },
    onError: (err, variables, context, er) => {
      import("sonner").then(({ toast }) => {
        toast.error(err.message || "Failed to update profile");
      });
      options?.onError?.(err, variables, context, er);
    },
  });
}

export function useRescheduleBooking(
  options?: Omit<
    UseMutationOptions<
      DoctorProfileBooking,
      ApiError,
      { bookingId: string; payload: RescheduleBookingPayload },
      unknown
    >,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();

  return useMutation<
    DoctorProfileBooking,
    ApiError,
    { bookingId: string; payload: RescheduleBookingPayload }
  >({
    mutationFn: async ({ bookingId, payload }) => {
      try {
        return await rescheduleBooking(bookingId, payload);
      } catch (e) {
        throw normalizeError(e);
      }
    },
    ...options,
    onSuccess: (data, variables, context, onMutateResult) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.doctorProfile.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
      import("sonner").then(({ toast }) => {
        toast.success("Booking rescheduled successfully!");
      });
      options?.onSuccess?.(data, variables, context, onMutateResult);
    },
    onError: (err, variables, context, er) => {
      import("sonner").then(({ toast }) => {
        toast.error(err.message || "Failed to reschedule booking");
      });
      options?.onError?.(err, variables, context, er);
    },
  });
}

export function useDoctorPublicProfile(
  id: string | undefined,
  options?: QueryOpts<DoctorProfileDetails>,
): UseQueryResult<DoctorProfileDetails, ApiError> {
  return useQuery<DoctorProfileDetails, ApiError>({
    queryKey: queryKeys.doctorProfile.public(id ?? ""),
    queryFn: async () => {
      try {
        return await getDoctorPublicProfile(id!);
      } catch (e) {
        throw normalizeError(e);
      }
    },
    enabled: !!id,
    staleTime: staleTime.profiles,
    ...options,
  });
}

// ─── Patient Medical Records Hooks ─────────────────────────────────────────────

export function usePatientRecords(
  options?: QueryOpts<PatientMedicalRecord[]>,
): UseQueryResult<PatientMedicalRecord[], ApiError> {
  return useQuery<PatientMedicalRecord[], ApiError>({
    queryKey: queryKeys.patientRecords.all,
    queryFn: async () => {
      try {
        return await getPatientRecords();
      } catch (e) {
        throw normalizeError(e);
      }
    },
    staleTime: staleTime.patientRecords,
    ...options,
  });
}

export function useAddPatientRecord(
  options?: Omit<
    UseMutationOptions<
      PatientMedicalRecord,
      ApiError,
      Omit<PatientMedicalRecord, "id" | "patientId" | "date"> & {
        date?: string;
      },
      unknown
    >,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();

  return useMutation<
    PatientMedicalRecord,
    ApiError,
    Omit<PatientMedicalRecord, "id" | "patientId" | "date"> & { date?: string }
  >({
    mutationFn: async (payload) => {
      try {
        return await addPatientRecord(payload);
      } catch (e) {
        throw normalizeError(e);
      }
    },
    ...options,
    onSuccess: (data, variables, context, onMutateResult) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patientRecords.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.patientProfile.me });
      options?.onSuccess?.(data, variables, context, onMutateResult);
    },
  });
}

// Type-safe hooks

// Support للـ options override

// ─── Testimonials ─────────────────────────────────────────────────────────────

export function useTestimonials(
  options?: QueryOpts<TestimonialItem[]>,
): UseQueryResult<TestimonialItem[], ApiError> {
  return useQuery<TestimonialItem[], ApiError>({
    queryKey: queryKeys.testimonials.all,
    queryFn: async () => {
      try {
        return await getTestimonials();
      } catch (e) {
        throw normalizeError(e);
      }
    },
    staleTime: staleTime.testimonials,
    ...options,
  });
}

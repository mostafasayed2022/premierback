// admin/hooks/useImagePicker.ts
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../api/client";
import { toast } from "sonner";
import axios from "axios";
import { uploadFile } from "@/lib/api/endpoints";
import { FileUpload } from "@/lib/types";

// ─── Constants ──────────────────────────────────────────────────

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "https://api.premierhealthclinics.com/api"
).replace(/\/+$/, "");

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "svg", "gif"];
const VIDEO_EXTENSIONS = ["mp4", "mov", "webm", "avi", "mkv", "m4v", "ogv"];

// ─── Types ──────────────────────────────────────────────────────

export interface AdminFile {
  id: number;
  original_name: string;
  extension: string;
  size_display: string;
  url: string;
}

interface UseImagePickerProps {
  value: number | null;
  initialImageUrl?: string | null;
  onChange: (fileId: number | null, previewUrl?: string) => void;
  isVideoField?: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────

const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  // Priority: admin token first, then access token, then patient (last resort)
  return (
    localStorage.getItem("admin_access") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("patient_access")
  );
};

import { getErrorMessage } from "@/lib/utils/error";

const mapFiles = (apiFiles: FileUpload[]): AdminFile[] => {
  return apiFiles.map((f) => ({
    id: f.id,
    original_name: f.original_name,
    extension: f.extension,
    size_display: f.size_display,
    url: f.url,
  }));
};

// ─── Hook ───────────────────────────────────────────────────────

export function useImagePicker({
  value,
  initialImageUrl,
  onChange,
  isVideoField = false,
}: UseImagePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialImageUrl || null,
  );
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [libraryFiles, setLibraryFiles] = useState<AdminFile[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [librarySearch, setLibrarySearch] = useState("");

  // ── Sync preview when value or initialImageUrl changes ──────────────────
  useEffect(() => {
    if (!value) {
      setPreviewUrl(null);
    } else if (initialImageUrl) {
      setPreviewUrl(initialImageUrl);
    }
  }, [value, initialImageUrl]);

  // ── Upload single file with progress ──────────────────────────
  const uploadSingleFile = useCallback(
    async (file: File): Promise<FileUpload> => {
      return await uploadFile(file, (percent) => {
        setProgress(percent);
      });
    },
    [],
  );

  // ── Handle upload from file input ─────────────────────────────
  const handleUpload = useCallback(
    async (file: File) => {
      // Validate file type
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      // If isVideoField=true → only videos; otherwise accept both images & videos
      const allowedExtensions = isVideoField
        ? VIDEO_EXTENSIONS
        : [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS];
      if (!allowedExtensions.includes(ext)) {
        const typeLabel = isVideoField ? "video" : "image or video";
        toast.error(
          `Invalid file type: .${ext}. Please select a ${typeLabel}.`,
        );
        return;
      }

      // Validate file size (100MB max for video, 10MB for images)
      const isVideo = VIDEO_EXTENSIONS.includes(ext);
      const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
      const maxLabel = isVideo ? "100MB" : "10MB";
      if (file.size > maxSize) {
        toast.error(`File is too large. Maximum size is ${maxLabel}.`);
        return;
      }

      setUploading(true);
      setProgress(0);

      try {
        const data = await uploadSingleFile(file);
        onChange(data.id, data.url);
        setPreviewUrl(data.url);
        const label = isVideo ? "Video" : "Image";
        toast.success(`${label} uploaded successfully`);
      } catch (err: unknown) {
        const message = getErrorMessage(err);
        toast.error("Upload failed: " + message);
      } finally {
        setUploading(false);
        setProgress(0);
        // Reset file input so same file can be re-uploaded
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [uploadSingleFile, onChange, isVideoField],
  );

  // ── File input change handler ──────────────────────────────────
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleUpload(file);
    },
    [handleUpload],
  );

  // ── Trigger file input click ───────────────────────────────────
  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // ── Fetch files for library browser ────────────────────────────
  const fetchLibraryFiles = useCallback(async (): Promise<AdminFile[]> => {
    const data = await api.get<FileUpload[]>("/files/");

    const files: FileUpload[] = Array.isArray(data)
      ? data
      : (data as unknown as { results: FileUpload[] }).results || [];

    return mapFiles(files);
  }, []);

  // ── Open file picker modal ─────────────────────────────────────
  const openFilePicker = useCallback(async () => {
    setShowFilePicker(true);
    setLibraryLoading(true);
    setLibrarySearch("");

    try {
      const files = await fetchLibraryFiles();
      setLibraryFiles(files);
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      toast.error("Failed to load files: " + message);
    } finally {
      setLibraryLoading(false);
    }
  }, [fetchLibraryFiles]);

  // ── Close file picker modal ────────────────────────────────────
  const closeFilePicker = useCallback(() => {
    setShowFilePicker(false);
  }, []);

  // ── Select file from library ───────────────────────────────────
  const selectFromLibrary = useCallback(
    (file: AdminFile) => {
      onChange(file.id, file.url);
      setPreviewUrl(file.url);
      setShowFilePicker(false);
      const isVideo = VIDEO_EXTENSIONS.includes(file.extension?.toLowerCase());
      toast.success(
        isVideo ? "Video selected from library" : "Image selected from library",
      );
    },
    [onChange],
  );

  // ── Remove current image ───────────────────────────────────────
  const handleRemove = useCallback(() => {
    onChange(null, undefined);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.success("File removed");
  }, [onChange]);

  // ── Filter library based on field type ─────────────────────────────
  const allowedFiles = libraryFiles.filter((f) => {
    const ext = f.extension?.toLowerCase();
    if (isVideoField) {
      // Strict video-only picker: show only video files
      return VIDEO_EXTENSIONS.includes(ext);
    }
    // General picker: show both images AND videos (e.g. testimonial image field
    // can pick any media, video field also needs to pick videos from library)
    return IMAGE_EXTENSIONS.includes(ext) || VIDEO_EXTENSIONS.includes(ext);
  });

  // ── Search filter ─────────────────────────────────────────────────────────────
  const filteredLibrary = allowedFiles.filter((f) =>
    f.original_name.toLowerCase().includes(librarySearch.toLowerCase()),
  );

  // ── Check if file is currently selected ────────────────────────
  const isSelected = useCallback((fileId: number) => value === fileId, [value]);

  return {
    // State
    uploading,
    progress,
    previewUrl,
    showFilePicker,
    libraryLoading,
    librarySearch,
    filteredLibrary,
    fileInputRef,

    // Actions
    setLibrarySearch,
    handleFileInputChange,
    triggerFileInput,
    openFilePicker,
    closeFilePicker,
    selectFromLibrary,
    handleRemove,
    isSelected,
  };
}

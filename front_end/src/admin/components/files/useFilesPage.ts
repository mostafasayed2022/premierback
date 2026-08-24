// admin/components/files/useFilesPage.ts
"use client";
import { useState, useEffect, useCallback } from "react";
import { api } from "../../api/client";
import { toast } from "sonner";
import axios from "axios";
import { uploadFile } from "@/lib/api/endpoints";
import { FileUpload } from "@/lib/types";

// ─── Constants ──────────────────────────────────────────────────

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "https://api.premierhealthclinics.com/api"
).replace(/\/+$/, "");

const ALLOWED_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "csv",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "mp4",
  "mp3",
  "mov",
  "txt",
  "md",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ─── Types ──────────────────────────────────────────────────────

export interface AdminFile {
  id: number;
  original_name: string;
  extension: string;
  size_display: string;
  created_at: string;
  url: string;
}

export interface UploadQueueItem {
  id: string;
  name: string;
  size: number;
  progress: number;
  previewUrl?: string;
  status: "uploading" | "success" | "error";
  errorMessage?: string;
}

interface ValidationResult {
  valid: boolean;
  reason?: string;
}

// ─── Helpers ────────────────────────────────────────────────────

const validateFile = (file: File): ValidationResult => {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, reason: `File type '.${ext}' is not supported.` };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, reason: "File size exceeds the 10MB limit." };
  }
  return { valid: true };
};

const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("patient_access") ||
    localStorage.getItem("admin_access") ||
    localStorage.getItem("access_token")
  );
};

import { getErrorMessage } from "@/lib/utils/error";

// ─── Hook ───────────────────────────────────────────────────────

export function useFilesPage() {
  const [files, setFiles] = useState<AdminFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);

  // ── Load files ───────────────────────────────────────────────
  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<FileUpload[]>("/files/");

      const apiFiles: FileUpload[] = Array.isArray(data)
        ? data
        : (data as unknown as { results: FileUpload[] }).results || [];

      const mapped: AdminFile[] = apiFiles.map((f) => ({
        id: f.id,
        original_name: f.original_name,
        extension: f.extension,
        size_display: f.size_display,
        created_at: f.created_at,
        url: f.url,
      }));

      setFiles(mapped);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // ── Upload files ─────────────────────────────────────────────
  const handleUpload = useCallback(
    async (fileList: File[]) => {
      setUploading(true);
      const newItems: UploadQueueItem[] = [];
      const validFiles: File[] = [];

      for (const file of fileList) {
        const validation = validateFile(file);
        if (!validation.valid) {
          toast.error(`${file.name}: ${validation.reason}`);
          continue;
        }

        validFiles.push(file);

        const isImage = file.type.startsWith("image/");
        const previewUrl = isImage ? URL.createObjectURL(file) : undefined;
        const itemId = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

        newItems.push({
          id: itemId,
          name: file.name,
          size: file.size,
          progress: 0,
          previewUrl,
          status: "uploading",
        });
      }

      if (validFiles.length === 0) {
        setUploading(false);
        return;
      }

      setUploadQueue((prev) => [...newItems, ...prev]);

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const queueItem = newItems[i];

        // Simulated progress
        let progressVal = 0;
        const interval = setInterval(() => {
          progressVal = Math.min(
            progressVal + Math.floor(Math.random() * 15) + 5,
            95,
          );
          setUploadQueue((prev) =>
            prev.map((item) =>
              item.id === queueItem.id
                ? { ...item, progress: progressVal }
                : item,
            ),
          );
        }, 150);

        try {
          await uploadFile(file, (percent) => {
            setUploadQueue((prev) =>
              prev.map((item) =>
                item.id === queueItem.id
                  ? { ...item, progress: percent }
                  : item,
              ),
            );
          });

          clearInterval(interval);
          setUploadQueue((prev) =>
            prev.map((item) =>
              item.id === queueItem.id
                ? { ...item, progress: 100, status: "success" }
                : item,
            ),
          );
          toast.success(`${file.name} uploaded`);
        } catch (err: unknown) {
          clearInterval(interval);
          const errMsg = getErrorMessage(err);

          setUploadQueue((prev) =>
            prev.map((item) =>
              item.id === queueItem.id
                ? { ...item, status: "error", errorMessage: errMsg }
                : item,
            ),
          );
          toast.error(`Failed: ${file.name} — ${errMsg}`);
        }
      }

      await loadFiles();
      setUploading(false);
    },
    [loadFiles],
  );

  // ── Delete file ──────────────────────────────────────────────
  const handleDelete = useCallback(async (file: AdminFile) => {
    if (!window.confirm(`Delete "${file.original_name}"?`)) return;

    setDeleting(file.id);
    try {
      await api.delete(`/files/${file.id}/`);
      toast.success("File deleted");
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(null);
    }
  }, []);

  // ── Filtered results ─────────────────────────────────────────
  const filtered = files.filter((f) =>
    f.original_name.toLowerCase().includes(search.toLowerCase()),
  );

  return {
    files,
    loading,
    uploading,
    deleting,
    search,
    setSearch,
    uploadQueue,
    setUploadQueue,
    handleUpload,
    handleDelete,
    filtered,
  };
}

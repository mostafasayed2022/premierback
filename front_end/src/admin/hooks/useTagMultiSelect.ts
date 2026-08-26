// front_end/src/admin/hooks/useTagMultiSelect.ts
import { useState, useEffect, useRef } from "react";
import { api } from "@/admin/api/client";

// ─── Types ────────────────────────────────────────────────────────────────

export interface Option {
  id: number;
  name: string;
}

/** Raw item shape coming from the API before mapping. */
type RawItem = Record<string, unknown>;

/** Shape returned by the API — one of three possible layouts. */
type ApiResponse =
  | RawItem[]
  | { results: RawItem[] }
  | { data: RawItem[] }
  | Record<string, unknown>;

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Extracts the raw array from whatever shape the API returns. */
function extractRaw(response: ApiResponse): RawItem[] {
  if (Array.isArray(response)) return response;

  if (
    "results" in response &&
    Array.isArray((response as { results: unknown }).results)
  ) {
    return (response as { results: RawItem[] }).results;
  }

  if (
    "data" in response &&
    Array.isArray((response as { data: unknown }).data)
  ) {
    return (response as { data: RawItem[] }).data;
  }

  return [];
}

/** Maps a raw API item to an `Option` using the `labelField` or common fallbacks. */
function toOption(item: RawItem, labelField: string): Option {
  const name =
    (item[labelField] as string | undefined) ??
    (item.name as string | undefined) ??
    (item.title as string | undefined) ??
    (item.username as string | undefined) ??
    String(item.id);

  return { id: item.id as number, name };
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export interface UseTagMultiSelectOptions {
  endpoint: string;
  value: number[];
  onChange: (ids: number[]) => void;
  labelField?: string;
}

export interface UseTagMultiSelectReturn {
  options: Option[];
  selected: Option[];
  available: Option[];
  isOpen: boolean;
  search: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
  openDropdown: () => void;
  closeDropdown: () => void;
  setSearch: (value: string) => void;
  add: (id: number) => void;
  remove: (id: number) => void;
}

export function useTagMultiSelect({
  endpoint,
  value,
  onChange,
  labelField = "name",
}: UseTagMultiSelectOptions): UseTagMultiSelectReturn {
  const [options, setOptions] = useState<Option[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  // ── Fetch options from the API ─────────────────────────────────────────
  useEffect(() => {
    if (!endpoint) return;

    api
      .get<ApiResponse>(endpoint)
      .then((response) => {
        const raw = extractRaw(response);
        setOptions(raw.map((item) => toOption(item, labelField)));
      })
      .catch(console.error);
  }, [endpoint, labelField]);

  // ── Close on outside click ────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Derived state ─────────────────────────────────────────────────────
  const selected = options.filter((o) => value.includes(o.id));
  const available = options.filter(
    (o) =>
      !value.includes(o.id) &&
      o.name.toLowerCase().includes(search.toLowerCase()),
  );

  // ── Actions ───────────────────────────────────────────────────────────
  const add = (id: number) => {
    if (!value.includes(id)) onChange([...value, id]);
    setIsOpen(false);
    setSearch("");
  };

  const remove = (id: number) => onChange(value.filter((v) => v !== id));

  return {
    options,
    selected,
    available,
    isOpen,
    search,
    containerRef,
    openDropdown: () => setIsOpen(true),
    closeDropdown: () => setIsOpen(false),
    setSearch,
    add,
    remove,
  };
}

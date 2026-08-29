"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { schemaApi, crudApi } from "../api/admin";
import type { ModelSchema, PaginatedResponse } from "../api/admin";
import { useToast } from "../components/ui/Toast";

export type ModalType = "create" | "edit" | "delete" | null;

export function useDynamicPage(modelName: string) {
  const [schema, setSchema] = useState<ModelSchema | null>(null);
  const [schemaLoading, setSchemaLoading] = useState(true);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [listData, setListData] =
    useState<PaginatedResponse<Record<string, unknown>> | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [modal, setModal] = useState<ModalType>(null);
  const [activeRecord, setActiveRecord] =
    useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast, show: showToast } = useToast();
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load schema ──────────────────────────────────────────────────────────
  useEffect(() => {
    setSchemaLoading(true);
    setSchemaError(null);
    schemaApi
      .getSchema(modelName)
      .then((s) => {
        setSchema(s);
        setSchemaLoading(false);
      })
      .catch((e) => {
        setSchemaError(e.message);
        setSchemaLoading(false);
      });
  }, [modelName]);

  // ── Load list ────────────────────────────────────────────────────────────
  const loadList = useCallback(() => {
    if (!schema) return;
    setListLoading(true);
    const params: Record<string, string | number> = { page, page_size: pageSize };
    if (search) params.search = search;
    crudApi
      .list(schema.endpoint, params)
      .then((d) => {
        setListData(d);
        setListLoading(false);
      })
      .catch((e) => {
        showToast(e.message, "error");
        setListLoading(false);
      });
  }, [schema, page, pageSize, search, showToast]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  // ── Auto‑edit from query parameter ?edit=<id> ────────────────────────────
  useEffect(() => {
    if (!schema) return;
    const searchParams = new URLSearchParams(window.location.search);
    const editId = searchParams.get("edit");
    if (editId && !isNaN(Number(editId))) {
      crudApi
        .get<Record<string, unknown>>(schema.endpoint, editId)
        .then((record) => {
          setActiveRecord(record);
          setModal("edit");
          // Remove ?edit=... from the URL so it doesn’t re‑trigger
          const newUrl =
            window.location.pathname +
            window.location.search
              .replace(/[?&]edit=[^&]*/, "")
              .replace(/^&/, "?");
          window.history.replaceState({}, "", newUrl);
        })
        .catch((err) => {
          showToast(
            "Failed to load record: " + (err?.message ?? err),
            "error",
          );
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSearchChange = (v: string) => {
    setSearchInput(v);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(v);
      setPage(1);
    }, 400);
  };

  const handleCreate = async (data: Record<string, unknown>) => {
    setSaving(true);
    try {
      await crudApi.create(schema!.endpoint, data);
      showToast("Record created");
      setModal(null);
      loadList();
    } catch (e: unknown) {
      showToast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (data: Record<string, unknown>) => {
    setSaving(true);
    try {
      await crudApi.update(schema!.endpoint, activeRecord!.id as string, data);
      showToast("Record updated");
      setModal(null);
      setActiveRecord(null);
      loadList();
    } catch (e: unknown) {
      showToast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await crudApi.delete(schema!.endpoint, activeRecord!.id as string);
      showToast("Record deleted", "info");
      setModal(null);
      setActiveRecord(null);
      loadList();
    } catch (e: unknown) {
      showToast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  const openCreateModal = () => {
    setActiveRecord(null);
    setModal("create");
  };

  const openEditModal = (row: Record<string, unknown>) => {
    setActiveRecord(row);
    setModal("edit");
  };

  const openDeleteModal = (row: Record<string, unknown>) => {
    setActiveRecord(row);
    setModal("delete");
  };

  const closeModal = () => {
    setModal(null);
    setActiveRecord(null);
  };

  return {
    schema,
    schemaLoading,
    schemaError,
    listData,
    listLoading,
    page,
    setPage,
    pageSize,
    setPageSize,
    searchInput,
    modal,
    activeRecord,
    saving,
    toast,
    handleSearchChange,
    handleCreate,
    handleUpdate,
    handleDelete,
    openCreateModal,
    openEditModal,
    openDeleteModal,
    closeModal,
  };
}

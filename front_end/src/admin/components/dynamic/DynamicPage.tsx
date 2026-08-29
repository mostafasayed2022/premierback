"use client";
// admin/components/dynamic/DynamicPage.tsx
import React from "react";
import { S } from "../../lib/styles";
import { Icon } from "../../lib/icons";
import { useDynamicPage } from "../../hooks/useDynamicPage";
import { DynamicTable } from "./DynamicTable";
import { DynamicForm } from "./DynamicForm";
import { DeleteConfirm } from "../ui/DeleteConfirm";
import { Modal } from "../ui/Modal";
import { Pagination } from "../ui/Pagination";
import { Toast } from "../ui/Toast";
import { DynamicPageHero } from "./DynamicPageHero";

interface DynamicPageProps {
  modelName: string;
}

export function DynamicPage({ modelName }: DynamicPageProps) {
  const {
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
  } = useDynamicPage(modelName);

  if (schemaLoading)
    return (
      <div style={S.centerFlex}>
        {Icon.spinner}
        <span style={{ marginLeft: 12, opacity: 0.6 }}>Loading schema…</span>
      </div>
    );
  if (schemaError)
    return (
      <div style={S.centerFlex}>
        <span style={{ color: "#f87171" }}>Schema error: {schemaError}</span>
      </div>
    );
  if (!schema) return null;

  const handleSelectMultipleFiles = async (files: import("../image-picker/FilePickerModal").AdminFile[], formValues: Record<string, unknown>) => {
    if (!schema || files.length === 0) return;
    for (const file of files) {
      const isVideo = ["mp4", "mov", "webm", "avi", "mkv"].includes(file.extension?.toLowerCase());
      const cleanName = file.original_name.replace(/\.[^/.]+$/, "");
      const payload: Record<string, unknown> = {
        ...formValues,
        title: formValues.title || cleanName,
        title_ar: formValues.title_ar || formValues.title || cleanName,
        name: formValues.name || cleanName,
        is_active: formValues.is_active !== undefined ? formValues.is_active : true,
      };

      if (isVideo) {
        payload.video_id = file.id;
        payload.media_type = "video";
      } else {
        payload.image_id = file.id;
        payload.media_type = "image";
      }

      await handleCreate(payload);
    }
  };

  return (
    <div style={{ ...S.pageWrap, maxWidth: 1280 }}>
      <Toast toast={toast} />

      <DynamicPageHero schema={schema} openCreateModal={openCreateModal} />

      {/* ─── Search Toolbar ─── */}
      <div style={{ ...S.toolbar, marginBottom: 20 }} className="admin-toolbar">
        <div style={{ ...S.searchWrap, maxWidth: 420 }} className="admin-search-wrap">
          <span style={{ ...S.searchIcon, color: "#C8A96B" }}>{Icon.search}</span>
          <input
            style={{
              ...S.searchInput,
              borderRadius: 14,
              border: "1px solid rgba(200, 169, 107, 0.25)",
              padding: "11px 14px 11px 40px",
              fontSize: 13,
              boxShadow: "0 2px 12px rgba(153, 134, 117, 0.04)",
            }}
            placeholder={`Search ${schema.name} records…`}
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <div style={{ fontSize: 12, color: "#64748B", fontWeight: 600, marginLeft: "auto" }}>
          Showing {listData?.results?.length || 0} of {listData?.count ?? "—"} entries
        </div>
      </div>

      <DynamicTable
        schema={schema}
        data={listData?.results}
        loading={listLoading}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
      />

      <Pagination
        count={listData?.count ?? 0}
        currentPage={listData?.current_page ?? page}
        totalPages={listData?.total_pages ?? 1}
        onPageChange={(p) => setPage(p)}
        pageSize={pageSize}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
      />

      {modal === "create" && (
        <Modal title={`Create ${schema.name}`} onClose={closeModal}>
          <DynamicForm
            schema={schema}
            initial={null}
            onSubmit={handleCreate}
            onCancel={closeModal}
            loading={saving}
            onSelectMultipleFiles={handleSelectMultipleFiles}
          />
        </Modal>
      )}
      {modal === "edit" && activeRecord && (
        <Modal
          title={`Edit ${schema.name} #${activeRecord.id}`}
          onClose={closeModal}
        >
          <DynamicForm
            schema={schema}
            initial={activeRecord}
            onSubmit={handleUpdate}
            onCancel={closeModal}
            loading={saving}
          />
        </Modal>
      )}
      {modal === "delete" && activeRecord && (
        <Modal title="Confirm Deletion" onClose={closeModal}>
          <DeleteConfirm
            record={activeRecord}
            onConfirm={handleDelete}
            onCancel={closeModal}
            loading={saving}
          />
        </Modal>
      )}
    </div>
  );
}

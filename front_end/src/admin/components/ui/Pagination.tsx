"use client";
// admin/components/ui/Pagination.tsx
import React from "react";
import { S } from "../../lib/styles";

interface PaginationProps {
  count: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

export function Pagination({
  count,
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}: PaginationProps) {
  if (totalPages <= 0) return null;

  // Build page number array with ellipsis
  const getPages = (): (number | "...")[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | "...")[] = [1];
    if (currentPage > 3) pages.push("...");
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  const pages = getPages();

  const btnBase: React.CSSProperties = {
    minWidth: 36,
    height: 36,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    border: "1px solid rgba(200, 169, 107, 0.2)",
    background: "#FFFFFF",
    color: "#1F3D5A",
    transition: "all .15s",
    padding: "0 10px",
    fontFamily: "inherit",
    userSelect: "none",
  };

  const btnActive: React.CSSProperties = {
    background: "linear-gradient(135deg, #1F3D5A 0%, #152a3f 100%)",
    color: "#FFFFFF",
    borderColor: "#1F3D5A",
    boxShadow: "0 4px 12px rgba(31,61,90,0.2)",
  };

  const btnDisabled: React.CSSProperties = {
    opacity: 0.35,
    cursor: "not-allowed",
    pointerEvents: "none",
  };

  const btnEllipsis: React.CSSProperties = {
    ...btnBase,
    border: "none",
    background: "transparent",
    cursor: "default",
    color: "#64748B",
  };

  const startRecord = count === 0 ? 0 : (currentPage - 1) * (pageSize ?? 25) + 1;
  const endRecord = Math.min(currentPage * (pageSize ?? 25), count);

  return (
    <div style={S.pagination}>
      {/* Left: record count info */}
      <span style={S.paginationInfo}>
        {count === 0
          ? "No records"
          : `${startRecord}–${endRecord} of ${count} records`}
      </span>

      {/* Center: page buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {/* First page */}
        <button
          style={{ ...btnBase, ...(currentPage === 1 ? btnDisabled : {}) }}
          disabled={currentPage === 1}
          onClick={() => onPageChange(1)}
          title="First page"
        >
          «
        </button>

        {/* Prev */}
        <button
          style={{ ...btnBase, ...(currentPage === 1 ? btnDisabled : {}) }}
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          title="Previous page"
        >
          ‹
        </button>

        {/* Page numbers */}
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} style={btnEllipsis}>
              …
            </span>
          ) : (
            <button
              key={p}
              style={{
                ...btnBase,
                ...(p === currentPage ? btnActive : {}),
              }}
              onClick={() => p !== currentPage && onPageChange(p as number)}
            >
              {p}
            </button>
          ),
        )}

        {/* Next */}
        <button
          style={{
            ...btnBase,
            ...(currentPage === totalPages ? btnDisabled : {}),
          }}
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          title="Next page"
        >
          ›
        </button>

        {/* Last page */}
        <button
          style={{
            ...btnBase,
            ...(currentPage === totalPages ? btnDisabled : {}),
          }}
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(totalPages)}
          title="Last page"
        >
          »
        </button>
      </div>

      {/* Right: page size selector */}
      {onPageSizeChange && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "#64748B", fontWeight: 500 }}>
            Rows
          </span>
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            style={{
              padding: "5px 28px 5px 10px",
              borderRadius: 8,
              border: "1px solid rgba(200, 169, 107, 0.2)",
              background: "#FFFFFF",
              color: "#1F3D5A",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              outline: "none",
              appearance: "none",
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%231F3D5A' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 8px center",
              fontFamily: "inherit",
            }}
          >
            {pageSizeOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

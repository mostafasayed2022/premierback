"use client";
// admin/components/dashboard/BookingsTable.tsx
import React, { useMemo } from "react";
import { flexRender, type ColumnDef } from "@tanstack/react-table";
import { Icon } from "../../lib/icons";
import { useBookingsTable } from "../../hooks/useBookingsTable";
import {
  badgeGreen,
  badgeYellow,
  badgeRed,
  badgeGray,
  actionBtnStyle,
  containerStyle,
  searchBarStyle,
  searchWrapStyle,
  searchInputStyle,
  tableStyle,
  thStyle,
  tdStyle,
  paginationStyle,
  btnPageStyle,
  emptyCellStyle,
} from "./styles";

interface BookingsTableProps {
  bookings: any[];
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
}



// ─── Component ───────────────────────────────────────────────────────────────
export const BookingsTable = React.memo(function BookingsTable({ bookings, onEdit, onDelete }: BookingsTableProps) {
  // Column definitions live here — JSX is valid in .tsx
  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "id",
        header: "Booking Ref",
        cell: (info) => (
          <span style={{ fontFamily: "monospace", fontSize: 11, whiteSpace: "nowrap" }} title={String(info.getValue())}>
            {String(info.getValue()).substring(0, 8)}…
          </span>
        ),
      },
      {
        accessorKey: "patient",
        header: "Patient",
        cell: (info) => {
          const val = info.getValue() as any;
          return val?.user?.username || val?.username || String(val || "Guest");
        },
      },
      {
        accessorKey: "doctor",
        header: "Doctor",
        cell: (info) => {
          const val = info.getValue() as any;
          return val?.user?.username || val?.username || String(val || "Staff");
        },
      },
      {
        accessorKey: "date",
        header: "Date",
        cell: (info) => String(info.getValue() ?? ""),
      },
      {
        accessorKey: "start_time",
        header: "Time",
        cell: (info) => String(info.getValue()).substring(0, 5),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: (info) => {
          const status = String(info.getValue()).toLowerCase();
          const style =
            status === "confirmed"       ? badgeGreen  :
            status === "pending_payment" ? badgeYellow :
            status === "cancelled"       ? badgeRed    : badgeGray;
          return <span style={style}>{status.replace("_", " ")}</span>;
        },
      },
      {
        accessorKey: "fee",
        header: "Fee",
        cell: (info) => (
          <span style={{ fontWeight: "bold" }}>
            ${Number(info.getValue()).toFixed(2)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: (info) => (
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            {onEdit && (
              <button onClick={() => onEdit(info.row.original)} style={actionBtnStyle} title="Edit">
                {Icon.edit}
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(info.row.original)}
                style={{ ...actionBtnStyle, color: "#EF4444" }}
                title="Delete"
              >
                {Icon.trash}
              </button>
            )}
          </div>
        ),
      },
    ],
    [onEdit, onDelete],
  );

  // Pure-logic hook: no JSX inside
  const { table, globalFilter, setGlobalFilter } = useBookingsTable({
    data: bookings,
    columns,
  });

  return (
    <div style={containerStyle}>
      {/* Search */}
      <div style={searchBarStyle}>
        <div style={searchWrapStyle}>
          {Icon.search}
          <input
            type="text"
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search bookings..."
            style={searchInputStyle}
          />
        </div>
      </div>

      {/* Table */}
      <div className="admin-table-container" style={{ overflowX: "auto", width: "100%", maxWidth: "100%", WebkitOverflowScrolling: "touch", paddingBottom: 8 }}>
        <table style={tableStyle}>
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    onClick={h.column.getToggleSortingHandler()}
                    style={{ ...thStyle, cursor: h.column.getCanSort() ? "pointer" : "default" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {h.column.getCanSort() && (
                        <span style={{ fontSize: 9, opacity: 0.5 }}>
                          {h.column.getIsSorted() === "asc" ? " 🔼" : h.column.getIsSorted() === "desc" ? " 🔽" : " ↕️"}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} style={{ transition: "background-color 0.15s" }}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} style={tdStyle}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} style={emptyCellStyle}>
                  No bookings found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div style={paginationStyle}>
          {/* Record info */}
          <div style={{ fontSize: 12, color: "#64748B", minWidth: 140 }}>
            {(() => {
              const ps = table.getState().pagination.pageSize;
              const pi = table.getState().pagination.pageIndex;
              const total = table.getFilteredRowModel().rows.length;
              const start = pi * ps + 1;
              const end = Math.min((pi + 1) * ps, total);
              return total === 0 ? "No records" : `${start}–${end} of ${total} records`;
            })()}
          </div>

          {/* Page numbers */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {/* First */}
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              style={{ ...btnPageStyle, opacity: !table.getCanPreviousPage() ? 0.35 : 1 }}
            >«</button>
            {/* Prev */}
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              style={{ ...btnPageStyle, opacity: !table.getCanPreviousPage() ? 0.35 : 1 }}
            >‹</button>

            {/* Page numbers with ellipsis */}
            {(() => {
              const total = table.getPageCount();
              const cur = table.getState().pagination.pageIndex + 1;
              const pages: (number | "...")[] = [];
              if (total <= 7) {
                for (let i = 1; i <= total; i++) pages.push(i);
              } else {
                pages.push(1);
                if (cur > 3) pages.push("...");
                for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i);
                if (cur < total - 2) pages.push("...");
                pages.push(total);
              }
              return pages.map((p, i) =>
                p === "..." ? (
                  <span key={`e-${i}`} style={{ ...btnPageStyle, border: "none", background: "transparent", color: "#64748B" }}>…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => table.setPageIndex((p as number) - 1)}
                    style={{
                      ...btnPageStyle,
                      ...(p === cur ? {
                        background: "linear-gradient(135deg, #1F3D5A 0%, #152a3f 100%)",
                        color: "#FFFFFF",
                        borderColor: "#1F3D5A",
                      } : {}),
                    }}
                  >{p}</button>
                )
              );
            })()}

            {/* Next */}
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              style={{ ...btnPageStyle, opacity: !table.getCanNextPage() ? 0.35 : 1 }}
            >›</button>
            {/* Last */}
            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              style={{ ...btnPageStyle, opacity: !table.getCanNextPage() ? 0.35 : 1 }}
            >»</button>
          </div>

          {/* Page size selector */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 140, justifyContent: "flex-end" }}>
            <span style={{ fontSize: 11, color: "#64748B", fontWeight: 500 }}>Rows</span>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => { table.setPageSize(Number(e.target.value)); table.setPageIndex(0); }}
              style={{
                padding: "4px 24px 4px 8px", borderRadius: 8,
                border: "1px solid rgba(200, 169, 107, 0.2)", background: "#FFFFFF",
                color: "#1F3D5A", fontSize: 12, fontWeight: 600, cursor: "pointer",
                outline: "none", appearance: "none",
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%231F3D5A' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
                backgroundRepeat: "no-repeat", backgroundPosition: "right 6px center",
              }}
            >
              {[10, 25, 50, 100].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  );
});


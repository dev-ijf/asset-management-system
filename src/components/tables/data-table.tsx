import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui/empty-state";

type DataTableProps = {
  columns: ReactNode[];
  rows?: ReactNode[][];
  emptyTitle?: string;
};

/**
 * Compact table: small text and tight padding so ordinary values stay on one line.
 * Each cell is capped at 24rem; only text longer than that (e.g. a long unbroken name) wraps,
 * so one long value cannot stretch the whole table.
 */
export function DataTable({ columns, rows = [], emptyTitle }: DataTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-xs">
        <thead className="bg-[var(--table-head)]">
          <tr>
            {columns.map((column, columnIndex) => (
              <th
                key={columnIndex}
                className="whitespace-nowrap border border-[var(--border)] px-3 py-2.5 text-left font-semibold text-[var(--text)]"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="border border-[var(--border)] px-3 py-2.5 align-top text-[var(--text)]">
                    <div className="max-w-[24rem] [overflow-wrap:break-word]">{cell}</div>
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="border border-[var(--border)]">
                <EmptyState title={emptyTitle} />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

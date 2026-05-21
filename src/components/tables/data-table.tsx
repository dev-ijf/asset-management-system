import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui/empty-state";

type DataTableProps = {
  columns: string[];
  rows?: ReactNode[][];
  emptyTitle?: string;
};

export function DataTable({ columns, rows = [], emptyTitle }: DataTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-sm">
        <thead className="bg-[var(--table-head)]">
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                className="border border-[var(--border)] px-6 py-4 text-left font-medium text-[var(--text)]"
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
                  <td
                    key={cellIndex}
                    className="border border-[var(--border)] px-6 py-5 text-[var(--text)]"
                  >
                    {cell}
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

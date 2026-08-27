import { type ReactNode } from 'react';

interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'right' | 'center';
  hidden?: boolean;
}

interface TableRow {
  [key: string]: ReactNode | string | number | null;
}

interface DataTableProps {
  columns: TableColumn[];
  rows: TableRow[];
  onRowClick?: (row: TableRow) => void;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  rowIdKey?: string;
  emptyState?: ReactNode;
  className?: string;
  maxRowHeight?: boolean;
}

export function DataTable({
  columns, rows, onRowClick, selectable, selectedIds = [], onSelectionChange, rowIdKey = 'id', emptyState, className = '',
}: DataTableProps) {
  const visibleCols = columns.filter(c => !c.hidden);
  const allSelected = rows.length > 0 && selectedIds.length === rows.length;

  const toggleAll = () => {
    if (allSelected) onSelectionChange?.([]);
    else onSelectionChange?.(rows.map(r => String(r[rowIdKey])));
  };

  const toggleOne = (id: string) => {
    if (selectedIds.includes(id)) onSelectionChange?.(selectedIds.filter(i => i !== id));
    else onSelectionChange?.([...selectedIds, id]);
  };

  const alignClass = (align?: string) => align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10">
            {selectable && (
              <th className="py-3 px-3 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 accent-accent-500 cursor-pointer"
                />
              </th>
            )}
            {visibleCols.map(col => (
              <th
                key={col.key}
                className={`py-3 px-3 text-[10px] font-semibold text-muted uppercase tracking-wider whitespace-nowrap ${alignClass(col.align)}`}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={visibleCols.length + (selectable ? 1 : 0)} className="py-12">
                {emptyState || <div className="text-center text-sm text-muted">No data available</div>}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={String(row[rowIdKey]) || i}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-white/5 transition-colors ${onRowClick ? 'cursor-pointer hover:bg-white/5' : ''} ${selectedIds.includes(String(row[rowIdKey])) ? 'bg-accent-500/5' : ''}`}
              >
                {selectable && (
                  <td className="py-3 px-3" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(String(row[rowIdKey]))}
                      onChange={() => toggleOne(String(row[rowIdKey]))}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 accent-accent-500 cursor-pointer"
                    />
                  </td>
                )}
                {visibleCols.map(col => (
                  <td key={col.key} className={`py-3 px-3 text-sm text-secondary ${alignClass(col.align)} whitespace-nowrap`}>
                    {row[col.key] as ReactNode ?? '—'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i + 1;
    if (page <= 4) return i + 1;
    if (page >= totalPages - 3) return totalPages - 6 + i;
    return page - 3 + i;
  });

  return (
    <div className="flex items-center justify-between mt-4">
      <span className="text-xs text-muted">
        Page {page} of {totalPages}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="px-2.5 py-1 text-xs rounded-md border border-white/10 text-secondary hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Prev
        </button>
        {pages.map(p => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-7 h-7 text-xs rounded-md transition-colors ${p === page ? 'bg-accent-500 text-white' : 'text-secondary hover:bg-white/5'}`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="px-2.5 py-1 text-xs rounded-md border border-white/10 text-secondary hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}

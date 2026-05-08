import { ChevronLeft, ChevronRight } from "lucide-react";

interface DashboardPaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
}

export default function DashboardPagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 30],
  itemLabel = "records",
}: DashboardPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (totalItems === 0) {
    return null;
  }

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);
  const pages = getVisiblePages(currentPage, totalPages);

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-t border-gray-200 px-4 sm:px-6 py-4 bg-white">
      <p className="text-sm text-gray-600 text-center lg:text-left">
        Showing {start}-{end} of {totalItems} {itemLabel}
      </p>
      <div className="mx-auto lg:mx-0 flex max-w-full flex-col items-center gap-3 sm:flex-row">
        <div className="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl border border-gray-200 bg-white px-2 py-2 shadow-sm">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="inline-flex h-8 items-center gap-1 rounded-xl px-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="flex items-center gap-1">
            {pages.map((page, index) =>
              page === "ellipsis" ? (
                <span
                  key={`ellipsis-${index}`}
                  className="inline-flex h-8 min-w-8 items-center justify-center px-1 text-sm font-medium text-gray-400"
                >
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  type="button"
                  onClick={() => onPageChange(page)}
                  aria-current={page === currentPage ? "page" : undefined}
                  className={`inline-flex h-8 min-w-8 items-center justify-center rounded-xl px-2 text-sm font-semibold transition ${
                    page === currentPage
                      ? "bg-indigo-500 text-white shadow-sm"
                      : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
                  }`}
                >
                  {page}
                </button>
              ),
            )}
          </div>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="inline-flex h-8 items-center gap-1 rounded-xl px-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
            aria-label="Next page"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        {onPageSizeChange && (
          <label className="inline-flex h-10 items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 shadow-sm">
            <select
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="bg-transparent text-sm font-semibold text-gray-700 outline-none"
              aria-label="Rows per page"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option} / page
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </div>
  );
}

function getVisiblePages(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis", totalPages] as const;
  }

  if (currentPage >= totalPages - 3) {
    return [1, "ellipsis", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages] as const;
  }

  return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages] as const;
}

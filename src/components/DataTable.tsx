import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface DataTableColumn<Row> {
  id: string;
  header: string;
  cell: (row: Row) => ReactNode;
  srOnlyHeader?: boolean;
  align?: "start" | "end";
  hideBelow?: "md" | "xl";
}
export interface DataTableProps<Row> {
  caption: string;
  columns: readonly DataTableColumn<Row>[];
  rows: readonly Row[];
  rowKey: (row: Row) => string;
  rowHeader: (row: Row) => ReactNode;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  loading?: boolean;
}
const visibility = {
  md: "hidden md:table-cell",
  xl: "hidden xl:table-cell",
} as const;

/** The first column names the row; its content is supplied by rowHeader. */
export function DataTable<Row>({
  caption,
  columns,
  rows,
  rowKey,
  rowHeader,
  onLoadMore,
  hasMore,
  loadingMore = false,
  loading = false,
}: DataTableProps<Row>) {
  if (loading)
    return (
      <div role="status" aria-busy="true" className="flex flex-col gap-3">
        <span className="sr-only">Loading {caption}</span>
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <Card className="hidden py-0 md:block">
        <CardContent className="overflow-x-auto px-0">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{caption}</caption>
            <thead className="bg-muted text-sm font-medium">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.id}
                    scope="col"
                    className={cn(
                      "px-4 py-3 font-medium",
                      column.align === "end" && "text-right",
                      column.hideBelow && visibility[column.hideBelow],
                    )}
                  >
                    <span
                      className={column.srOnlyHeader ? "sr-only" : undefined}
                    >
                      {column.header}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  className="border-b border-border hover:bg-secondary"
                >
                  {columns.map((column, index) => {
                    const cellClass = cn(
                      "max-w-full break-words px-4 py-3",
                      column.align === "end" && "text-right",
                      column.hideBelow && visibility[column.hideBelow],
                    );
                    return index === 0 ? (
                      <th
                        key={column.id}
                        scope="row"
                        className={cn(
                          cellClass,
                          "font-medium focus-within:ring-2 focus-within:ring-ring",
                        )}
                      >
                        {rowHeader(row)}
                      </th>
                    ) : (
                      <td key={column.id} className={cellClass}>
                        {column.cell(row)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <ul
        aria-label={caption}
        className="flex min-w-0 flex-col gap-4 md:hidden"
      >
        {rows.map((row) => (
          <li key={rowKey(row)}>
            <Card>
              <CardContent className="flex min-w-0 flex-col gap-4">
                <div className="break-words font-semibold">
                  {rowHeader(row)}
                </div>
                <dl className="flex min-w-0 flex-col gap-3">
                  {columns.slice(1).map((column) => (
                    <div
                      key={column.id}
                      className="flex min-w-0 flex-col gap-1"
                    >
                      <dt className="text-sm text-muted-foreground">
                        {column.header}
                      </dt>
                      <dd className="break-words">{column.cell(row)}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
      {hasMore && onLoadMore ? (
        <Button variant="outline" disabled={loadingMore} onClick={onLoadMore}>
          {loadingMore ? "Loading…" : "Load more"}
        </Button>
      ) : null}
    </div>
  );
}

import { FilterBar } from "@/components/FilterBar";
export function EngagementFilters({
  search,
  status,
  setSearch,
  setStatus,
  count,
  hasMore,
  onReset,
}: {
  search: string;
  status: string;
  setSearch: (value: string) => void;
  setStatus: (value: string) => void;
  count: number;
  hasMore: boolean;
  onReset: () => void;
}) {
  return (
    <FilterBar
      search={{
        id: "engagement-search",
        label: "Search",
        placeholder: "Client or reference…",
        value: search,
        onChange: setSearch,
      }}
      filters={[
        {
          id: "engagement-status",
          label: "Status",
          value: status,
          defaultValue: "Active",
          options: [
            { value: "Active", label: "Active" },
            { value: "Closed", label: "Closed" },
            { value: "all", label: "All" },
          ],
          onChange: setStatus,
        },
      ]}
      resultCount={count}
      resultLabel={count === 1 ? "engagement" : "engagements"}
      hasMore={hasMore}
      onReset={onReset}
    />
  );
}

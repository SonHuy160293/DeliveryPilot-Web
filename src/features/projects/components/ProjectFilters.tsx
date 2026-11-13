import { FilterBar, type FilterBarProps } from "@/components/FilterBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { formatCount } from "@/lib/format";
export function ProjectFilters({
  search,
  status,
  kind,
  setSearch,
  setStatus,
  setKind,
  count,
  onReset,
}: {
  search: string;
  status: string;
  kind: string;
  setSearch: (value: string) => void;
  setStatus: (value: string) => void;
  setKind: (value: string) => void;
  count: number;
  onReset: () => void;
}) {
  const activeCount = Number(status !== "all") + Number(kind !== "all");
  const filters = (prefix: string): FilterBarProps["filters"] => [
    {
      id: `${prefix}-status`,
      label: "Status",
      value: status,
      onChange: setStatus,
      defaultValue: "all",
      options: [
        { value: "all", label: "All" },
        { value: "Draft", label: "Draft" },
        { value: "Active", label: "Active" },
      ],
    },
    {
      id: `${prefix}-kind`,
      label: "Kind",
      value: kind,
      onChange: setKind,
      defaultValue: "all",
      options: [
        { value: "all", label: "All" },
        { value: "Client", label: "Client" },
        { value: "Internal", label: "Internal" },
      ],
    },
  ];
  const searchProps = (id: string) => ({
    id,
    label: "Search projects",
    placeholder: "Project name…",
    value: search,
    onChange: setSearch,
  });
  return (
    <>
      <div
        role="group"
        aria-label="Project filters"
        className="hidden md:block"
      >
        <FilterBar
          search={searchProps("project-search")}
          filters={filters("project")}
          resultCount={count}
          resultLabel={count === 1 ? "project" : "projects"}
          onReset={onReset}
        />
      </div>
      <div
        role="group"
        aria-label="Mobile project filters"
        className="flex min-w-0 flex-col gap-3 md:hidden"
      >
        <FilterBar
          search={searchProps("project-search-mobile")}
          resultCount={count}
          resultLabel={count === 1 ? "project" : "projects"}
        />
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="self-start">
              Filters
              {activeCount ? (
                <Badge variant="secondary">{formatCount(activeCount)}</Badge>
              ) : null}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
              <SheetDescription>Projects you take part in.</SheetDescription>
            </SheetHeader>
            <div className="px-4 pb-6">
              <FilterBar
                filters={filters("project-mobile")}
                onReset={onReset}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

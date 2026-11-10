import { LayoutGrid, List, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrganizationSearch } from "@/features/workspaces/components/OrganizationSearch";
import {
  ALL_ROLES,
  type PortfolioSort,
  type PortfolioTab,
  type PortfolioView,
} from "@/features/workspaces/model/portfolio";

export interface PortfolioShape {
  tab: PortfolioTab;
  role: string;
  sort: PortfolioSort;
  name: string;
  view: PortfolioView;
}

const TABS: readonly { id: PortfolioTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "managed", label: "Managed by me" },
];
const VIEWS = [
  { id: "grid", label: "Grid view", Icon: LayoutGrid },
  { id: "list", label: "List view", Icon: List },
] as const;

export function PortfolioToolbar({
  shape,
  onChange,
  counts,
  roles,
  refresh,
  refreshing,
}: {
  shape: PortfolioShape;
  onChange: (next: Partial<PortfolioShape>) => void;
  counts: Record<PortfolioTab, string>;
  roles: readonly string[];
  refresh: () => unknown;
  refreshing: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div
        role="group"
        aria-label="Workspace membership filter"
        className="flex gap-1 self-start rounded-xl bg-secondary p-1"
      >
        {TABS.map(({ id, label }) => {
          const active = shape.tab === id;
          return (
            <Button
              key={id}
              type="button"
              variant="ghost"
              size="sm"
              aria-pressed={active}
              className={`h-9 rounded-lg font-semibold ${active ? "bg-card text-foreground shadow-sm hover:bg-card hover:text-foreground" : "text-muted-foreground hover:bg-transparent hover:text-foreground"}`}
              onClick={() => {
                onChange({ tab: id });
              }}
            >
              <span>{label}</span>
              <span
                className={`rounded-md px-2 text-xs tabular-nums ${active ? "bg-accent text-accent-foreground" : "bg-card text-muted-foreground"}`}
              >
                {counts[id]}
              </span>
            </Button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <OrganizationSearch
          value={shape.name}
          onChange={(name) => {
            onChange({ name });
          }}
        />
        <Select
          value={shape.role}
          onValueChange={(role) => {
            onChange({ role });
          }}
        >
          <SelectTrigger
            aria-label="Filter by role"
            className="w-auto flex-1 bg-card whitespace-nowrap shadow-none sm:flex-none"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value={ALL_ROLES}>All roles</SelectItem>
              {roles.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          value={shape.sort}
          onValueChange={(sort) => {
            onChange({ sort: sort === "name" ? "name" : "default" });
          }}
        >
          <SelectTrigger
            aria-label="Sort workspaces"
            className="w-auto flex-1 bg-card whitespace-nowrap shadow-none sm:flex-none"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="default">Default order</SelectItem>
              <SelectItem value="name">Name A–Z</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <div
          role="group"
          aria-label="Workspace layout"
          className="flex gap-1 rounded-lg border border-border bg-card p-1"
        >
          {VIEWS.map(({ id, label, Icon }) => (
            <Button
              key={id}
              type="button"
              size="icon"
              variant={shape.view === id ? "default" : "ghost"}
              aria-label={label}
              aria-pressed={shape.view === id}
              className={shape.view === id ? "" : "text-muted-foreground"}
              onClick={() => {
                onChange({ view: id });
              }}
            >
              <Icon aria-hidden="true" />
            </Button>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          aria-label="Refresh workspaces"
          className="size-11 bg-card shadow-none"
          disabled={refreshing}
          onClick={() => {
            void refresh();
          }}
        >
          <RefreshCw aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

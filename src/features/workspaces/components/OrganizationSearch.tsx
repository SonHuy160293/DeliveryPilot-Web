import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OrganizationSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex w-full flex-col gap-2 sm:w-64">
      <Label htmlFor="workspace-filter" className="text-sm font-medium">
        Filter loaded workspaces
      </Label>
      <div className="relative flex items-center">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 size-4 text-muted-foreground"
        />
        <Input
          id="workspace-filter"
          type="search"
          placeholder="Search loaded workspaces…"
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          className="bg-card pl-8"
        />
      </div>
    </div>
  );
}

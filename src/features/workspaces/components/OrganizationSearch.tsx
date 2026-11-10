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
    <div className="relative flex w-full items-center sm:w-64">
      <Label htmlFor="workspace-filter" className="sr-only">
        Search workspaces
      </Label>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 size-4 text-muted-foreground"
      />
      <Input
        id="workspace-filter"
        type="search"
        autoComplete="off"
        placeholder="Search workspaces…"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        className="bg-card pl-8 text-sm shadow-none"
      />
    </div>
  );
}

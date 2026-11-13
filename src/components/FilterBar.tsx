import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCount } from "@/lib/format";

export interface FilterBarProps {
  search?: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  filters?: readonly {
    id: string;
    label: string;
    value: string;
    options: readonly { value: string; label: string }[];
    onChange: (value: string) => void;
    defaultValue?: string;
  }[];
  resultCount?: number;
  resultLabel?: string;
  onReset?: () => void;
  hasMore?: boolean;
}
export function FilterBar({
  search,
  filters = [],
  resultCount,
  resultLabel = "projects",
  onReset,
  hasMore = false,
}: FilterBarProps) {
  const filtered =
    Boolean(search?.value) ||
    filters.some(
      (filter) =>
        filter.value !== (filter.defaultValue ?? filter.options[0]?.value),
    );
  return (
    <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-end">
      {search ? (
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Label htmlFor={search.id}>{search.label}</Label>
          <Input
            id={search.id}
            value={search.value}
            placeholder={search.placeholder}
            onChange={(event) => {
              search.onChange(event.target.value);
            }}
            aria-describedby={hasMore ? `${search.id}-scope` : undefined}
          />
          {hasMore ? (
            <p
              id={`${search.id}-scope`}
              className="text-sm text-muted-foreground"
            >
              Searches loaded results.
            </p>
          ) : null}
        </div>
      ) : null}
      {filters.map((filter) => {
        const values = new Set(filter.options.map((option) => option.value));
        let emptyOption = "__empty";
        while (values.has(emptyOption)) emptyOption += "_";
        return (
          <div key={filter.id} className="flex min-w-0 flex-col gap-2">
            <Label htmlFor={filter.id}>{filter.label}</Label>
            <Select
              value={filter.value || emptyOption}
              onValueChange={(value) => {
                filter.onChange(value === emptyOption ? "" : value);
              }}
            >
              <SelectTrigger id={filter.id} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {filter.options.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value || emptyOption}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        );
      })}
      {resultCount !== undefined ? (
        <p role="status" className="text-sm">
          {formatCount(resultCount)} {resultLabel}
        </p>
      ) : null}
      {filtered && onReset ? (
        <Button type="button" variant="ghost" onClick={onReset}>
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}

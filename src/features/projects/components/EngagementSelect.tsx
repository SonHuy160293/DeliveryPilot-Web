import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import type { ProjectEngagementRef } from "@/features/projects/api/types";
export function EngagementSelect({
  value,
  onChange,
  onBlur,
  engagements,
  disabled,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  engagements: readonly ProjectEngagementRef[];
  disabled: boolean;
  error?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Label htmlFor="prj-engagement">Engagement</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          id="prj-engagement"
          onBlur={onBlur}
          aria-required="true"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "prj-engagement-error" : undefined}
          className="w-full"
        >
          <SelectValue placeholder="Choose the engagement this project delivers." />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {engagements.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.clientDisplayName} — {item.engagementName ?? "Not named"}{" "}
                ({item.agreementReference})
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {error ? (
        <p
          id="prj-engagement-error"
          role="alert"
          className="text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

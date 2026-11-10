import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { lifecycle } from "@/features/workspaces/api/contracts";
import type { OfferStatus } from "@/features/workspaces/api/queries";
import { formatStatus } from "@/features/workspaces/model/formatters";

export function StatusFilter({
  id,
  value,
  onChange,
}: {
  id: string;
  value: OfferStatus;
  onChange: (value: OfferStatus) => void;
}) {
  return (
    <div className="flex max-w-sm flex-col gap-2">
      <Label htmlFor={id}>Status</Label>
      <Select
        value={value}
        onValueChange={(next) => {
          const parsed = lifecycle.safeParse(next);
          if (parsed.success) onChange(parsed.data);
        }}
      >
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {lifecycle.options.map((status) => (
              <SelectItem key={status} value={status}>
                {formatStatus(status)}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

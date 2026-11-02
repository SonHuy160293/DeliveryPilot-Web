import { useId, type Ref } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function ChoiceList({
  label,
  options,
  selected,
  onChange,
  error,
  onBlur,
  firstRef,
}: {
  label: string;
  options: { id: string; name: string; disabled?: boolean }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  error?: string;
  onBlur?: () => void;
  firstRef?: Ref<HTMLButtonElement>;
}) {
  const id = useId();
  return (
    <fieldset
      className="flex min-w-0 flex-col gap-3"
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${id}-error` : undefined}
      onBlur={onBlur}
    >
      <legend className="mb-2 text-sm font-medium">{label}</legend>
      {options.map((option, index) => (
        <div key={option.id} className="flex min-w-0 items-start gap-3">
          <Checkbox
            ref={index === 0 ? firstRef : undefined}
            id={`${id}-${String(index)}`}
            checked={selected.includes(option.id)}
            disabled={option.disabled}
            onCheckedChange={(checked) => {
              onChange(
                checked === true
                  ? [...selected, option.id]
                  : selected.filter((value) => value !== option.id),
              );
            }}
          />
          <Label
            htmlFor={`${id}-${String(index)}`}
            className="min-h-6 min-w-0 break-all leading-relaxed"
          >
            {option.name}
          </Label>
        </div>
      ))}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

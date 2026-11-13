import { useId, useState, type ComponentProps } from "react";
import { TextareaField } from "@/components/FormField";
import { formatCount } from "@/lib/format";

export interface ReasonFieldProps extends Omit<
  ComponentProps<"textarea">,
  "required"
> {
  required: boolean;
  label?: string;
  error?: string;
}
export function ReasonField({
  required,
  label,
  id: suppliedId,
  error,
  value,
  defaultValue,
  onChange,
  ...props
}: ReasonFieldProps) {
  const generatedId = useId();
  const id = suppliedId ?? generatedId;
  const [text, setText] = useState(String(defaultValue ?? ""));
  const count = String(value ?? text).length;
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <TextareaField
        {...props}
        id={id}
        label={label ?? (required ? "Reason" : "Reason (optional)")}
        required={required}
        value={value}
        defaultValue={defaultValue}
        maxLength={2000}
        error={error}
        aria-describedby={`${id}-count${error ? ` ${id}-error` : ""}`}
        onChange={(event) => {
          setText(event.target.value);
          onChange?.(event);
        }}
      />
      <p id={`${id}-count`} className="text-xs text-muted-foreground">
        {formatCount(count)} / 2,000
      </p>
    </div>
  );
}

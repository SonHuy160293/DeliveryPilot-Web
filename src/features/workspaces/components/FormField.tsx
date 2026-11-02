import type { ComponentProps, ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function FieldLayout({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
export function FormField({
  id,
  label,
  error,
  ...props
}: ComponentProps<"input"> & { id: string; label: string; error?: string }) {
  return (
    <FieldLayout id={id} label={label} error={error}>
      <Input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
    </FieldLayout>
  );
}
export function TextareaField({
  id,
  label,
  error,
  ...props
}: ComponentProps<"textarea"> & { id: string; label: string; error?: string }) {
  return (
    <FieldLayout id={id} label={label} error={error}>
      <Textarea
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
    </FieldLayout>
  );
}

import type { ReactNode } from "react";
import type { FieldPath, FieldValues, UseFormReturn } from "react-hook-form";
import type { z } from "zod";

export interface FormDialogProps<
  TValues extends FieldValues,
  TOutput extends FieldValues = TValues,
> {
  title: string;
  description?: string;
  trigger: ReactNode;
  submitLabel: string;
  submitDisabled?: boolean;
  schema: z.ZodType<TOutput, TValues>;
  defaultValues: TValues;
  onSubmit: (values: TOutput) => Promise<"done" | "keep-open">;
  children: (form: UseFormReturn<TValues, unknown, TOutput>) => ReactNode;
  onReload?: () => Promise<TValues>;
  serverFields?: readonly FieldPath<TValues>[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  errorPresentation?: (error: unknown) => ReactNode;
}

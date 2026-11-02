import { useServerFieldErrors } from "@/features/workspaces/model/useServerFieldErrors";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { safeReason } from "@/features/workspaces/api/inputs";
import { TextareaField } from "@/features/workspaces/components/FormField";
import { ApiFeedback } from "@/features/workspaces/components/ApiFeedback";
import { useRateLimit } from "@/features/workspaces/model/useRateLimit";
import { RetryDelay } from "@/features/workspaces/components/RetryDelay";

const serverFields = ["reason"] as const;
export function ConfirmAction({
  label,
  target,
  consequence,
  reasonMode = "required",
  pending,
  error,
  onConfirm,
  onOpenChange,
  disabled = false,
}: {
  label: string;
  target: string;
  consequence: string;
  reasonMode?: "none" | "optional" | "required";
  pending: boolean;
  error: unknown;
  onConfirm: (reason: string | null) => Promise<boolean>;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rate = useRateLimit(error);
  const schema = z.object({
    reason: z
      .string()
      .refine(
        (value) =>
          (reasonMode !== "required" && !value.trim()) ||
          safeReason.safeParse(value).success,
        "Enter a business reason of 1–1,000 characters without links, email addresses, or credentials.",
      ),
  });
  const {
    register,
    setError,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ reason: string }>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: { reason: "" },
  });
  async function submit(values: { reason: string }) {
    if (await onConfirm(values.reason.trim() || null)) {
      setOpen(false);
      onOpenChange?.(false);
      reset();
    }
  }
  useServerFieldErrors(error, setError, serverFields);
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) {
          setOpen(next);
          onOpenChange?.(next);
          if (!next) reset();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="max-w-full min-w-0 whitespace-normal break-all text-left"
          disabled={disabled || pending || rate.blocked}
        >
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="break-all">
            {label}: {target}
          </DialogTitle>
          <DialogDescription>
            {consequence} The server checks your current authority.
          </DialogDescription>
        </DialogHeader>
        <form
          noValidate
          onSubmit={(event) => {
            void handleSubmit(submit)(event);
          }}
          className="flex flex-col gap-4"
        >
          {reasonMode !== "none" ? (
            <TextareaField
              id="action-reason"
              label={reasonMode === "required" ? "Reason" : "Reason (optional)"}
              required={reasonMode === "required"}
              maxLength={1000}
              error={errors.reason?.message}
              {...register("reason")}
            />
          ) : null}
          <ApiFeedback error={error} write />
          {rate.blocked ? <RetryDelay delay={rate.delay} /> : null}
          {rate.delay > 0 && !rate.blocked ? (
            <p role="status">You can retry now.</p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => {
                setOpen(false);
                onOpenChange?.(false);
                reset();
              }}
            >
              Keep current state
            </Button>
            <Button
              type="submit"
              className="max-w-full min-w-0 whitespace-normal break-all"
              disabled={pending || rate.blocked}
            >
              {pending ? "Submitting…" : label}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

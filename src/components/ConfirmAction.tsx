import { useServerFieldErrors } from "@/lib/useServerFieldErrors";
import { useState, type ComponentProps } from "react";
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
import { safeReason } from "@/lib/safeReason";
import { TextareaField } from "@/components/FormField";
import { ApiFeedback } from "@/components/ApiFeedback";
import { useRateLimit } from "@/lib/api/useRateLimit";
import { RetryDelay } from "@/components/RetryDelay";

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
  showAuthorityNotice = true,
  onCloseAutoFocus,
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
  showAuthorityNotice?: boolean;
  onCloseAutoFocus?: ComponentProps<typeof DialogContent>["onCloseAutoFocus"];
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
      <DialogContent onCloseAutoFocus={onCloseAutoFocus}>
        <DialogHeader>
          <DialogTitle className="break-all">
            {label}: {target}
          </DialogTitle>
          <DialogDescription>
            {consequence}
            {showAuthorityNotice
              ? " The server checks your current authority."
              : ""}
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

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, type FieldPath, type FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { FormDialogProps } from "@/lib/formDialogTypes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormDialogDiscard } from "@/components/FormDialogDiscard";
import { FormDialogFeedback } from "@/components/FormDialogFeedback";
import { FormReadOnlyContext } from "@/lib/formReadOnly";
import { useServerFieldErrors } from "@/lib/useServerFieldErrors";

export type { FormDialogProps } from "@/lib/formDialogTypes";

export function FormDialog<
  TValues extends FieldValues,
  TOutput extends FieldValues = TValues,
>({
  title,
  description,
  trigger,
  submitLabel,
  submitDisabled = false,
  schema,
  defaultValues,
  onSubmit,
  children,
  onReload,
  serverFields,
  open: providedOpen,
  onOpenChange,
  errorPresentation,
}: FormDialogProps<TValues, TOutput>) {
  const [open, setOpen] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [error, setError] = useState<unknown>();
  const [reloading, setReloading] = useState(false);
  const attempt = useRef(0);
  useEffect(
    () => () => {
      attempt.current++;
    },
    [],
  );
  const form = useForm<TValues, unknown, TOutput>({
    resolver: zodResolver(schema),
    values: defaultValues,
    mode: "onTouched",
  });
  const { isDirty, isSubmitting } = form.formState;
  const fields = useMemo(
    () =>
      serverFields ??
      Object.keys(defaultValues).filter((key): key is FieldPath<TValues> =>
        Object.hasOwn(defaultValues, key),
      ),
    [defaultValues, serverFields],
  );
  useServerFieldErrors(error, form.setError, fields);
  function setDialogOpen(next: boolean) {
    setOpen(next);
    onOpenChange?.(next);
  }
  function close() {
    attempt.current++;
    setDialogOpen(false);
    setDiscard(false);
    setError(undefined);
    form.reset(defaultValues);
  }
  function requestClose() {
    if (isDirty) setDiscard(true);
    else close();
  }
  async function submit(values: TOutput) {
    const current = ++attempt.current;
    setError(undefined);
    try {
      const result = await onSubmit(values);
      if (current === attempt.current && result === "done") close();
    } catch (failure) {
      if (current === attempt.current) setError(failure);
    }
  }
  async function reload() {
    if (!onReload) return;
    const current = ++attempt.current;
    setReloading(true);
    try {
      const values = await onReload();
      if (current === attempt.current) {
        form.reset(values);
        setError(undefined);
      }
    } catch (failure) {
      if (current === attempt.current) setError(failure);
    } finally {
      setReloading(false);
    }
  }
  return (
    <Dialog
      open={providedOpen ?? open}
      onOpenChange={(next) => {
        if (next) setDialogOpen(true);
        else if (discard) setDiscard(false);
        else requestClose();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="min-w-0 grid-cols-1 break-words">
        {discard ? (
          <FormDialogDiscard
            onKeep={() => {
              setDiscard(false);
            }}
            onDiscard={close}
          />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              {description ? (
                <DialogDescription>{description}</DialogDescription>
              ) : (
                <DialogDescription className="sr-only">
                  {title}
                </DialogDescription>
              )}
            </DialogHeader>
            <form
              noValidate
              className="flex min-w-0 flex-col gap-4"
              onSubmit={(event) => {
                void form.handleSubmit(submit)(event);
              }}
            >
              {errorPresentation?.(error) ?? (
                <FormDialogFeedback
                  error={error}
                  pending={reloading}
                  onReload={
                    onReload
                      ? () => {
                          void reload();
                        }
                      : undefined
                  }
                />
              )}
              <FormReadOnlyContext.Provider value={isSubmitting || reloading}>
                {children(form)}
              </FormReadOnlyContext.Provider>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={requestClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitDisabled || isSubmitting || reloading}
                >
                  {isSubmitting ? "Saving…" : submitLabel}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

import { useServerFieldErrors } from "@/lib/useServerFieldErrors";
import type { RefObject } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { workspaceName } from "@/features/workspaces/api/inputs";
import type { SessionOwner } from "@/features/workspaces/api/request";
import { useWorkspaceCreation } from "@/features/workspaces/model/useWorkspaceCreation";
import { ApiFeedback } from "@/components/ApiFeedback";
import { FormField } from "@/components/FormField";
import { workspaceOverviewPath } from "@/lib/routes";
import { CreationRecovery } from "@/features/workspaces/components/CreationRecovery";

const schema = z.object({ name: workspaceName });
type Values = z.infer<typeof schema>;
const serverFields = ["name"] as const;
export function WorkspaceCreateDialog({
  owner,
  open,
  onOpenChange,
  returnFocusRef,
  fallbackFocusRef,
}: {
  owner: SessionOwner;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  fallbackFocusRef?: RefObject<HTMLElement | null>;
}) {
  const {
    register,
    setError,
    getValues,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: { name: "" },
  });
  const { create, attempt, uncertain, expired, submit, clear } =
    useWorkspaceCreation(owner);
  const frozen = Boolean(attempt) && !create.isSuccess;
  function abandon() {
    clear();
    reset();
  }
  function editDetails() {
    const name = getValues("name");
    clear();
    reset({ name });
  }
  useServerFieldErrors(create.error, setError, serverFields);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onCloseAutoFocus={(event) => {
          const target = returnFocusRef.current?.isConnected
            ? returnFocusRef.current
            : fallbackFocusRef?.current;
          if (target) {
            event.preventDefault();
            target.focus();
            returnFocusRef.current = null;
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Create workspace</DialogTitle>
          <DialogDescription>
            Enter a name for your workspace.
          </DialogDescription>
        </DialogHeader>
        <form
          noValidate
          onSubmit={(event) => {
            void handleSubmit(submit)(event);
          }}
          className="flex flex-col gap-4"
        >
          <FormField
            id="workspace-name"
            label="Workspace name"
            required
            maxLength={160}
            readOnly={frozen || create.isSuccess}
            error={errors.name?.message}
            {...register("name")}
          />
          <ApiFeedback error={create.error} write />
          {create.isSuccess ? (
            <ApiFeedback>
              Workspace creation was confirmed. Its current membership will be
              checked when opened.
            </ApiFeedback>
          ) : null}
          {uncertain ? (
            <p className="text-sm">
              Close and refresh the workspace list if needed. Retrying here uses
              the same attempt and name. Reloading loses this recovery option.
            </p>
          ) : null}
          <DialogFooter className="flex-wrap">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
              }}
            >
              Close creation
            </Button>
            {attempt && !create.isPending && !create.isSuccess ? (
              <CreationRecovery
                uncertain={uncertain}
                abandon={abandon}
                editDetails={editDetails}
              />
            ) : null}
            {create.isSuccess ? (
              <Button type="button" variant="outline" onClick={abandon}>
                Start another workspace
              </Button>
            ) : null}
            {create.isSuccess ? (
              <Button asChild>
                <Link to={workspaceOverviewPath(create.data.organizationId)}>
                  Open workspace
                </Link>
              </Button>
            ) : (
              <Button type="submit" disabled={create.isPending || expired}>
                {create.isPending
                  ? "Creating…"
                  : attempt
                    ? "Retry same attempt"
                    : "Create workspace"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useServerFieldErrors } from "@/features/workspaces/model/useServerFieldErrors";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { workspaceName } from "@/features/workspaces/api/inputs";
import type { Role } from "@/features/workspaces/api/contracts";
import type { ScopedOwner } from "@/features/workspaces/api/queries";
import { workspaceApi } from "@/features/workspaces/api/workspaceApi";
import { useWorkspaceMutation } from "@/features/workspaces/model/useWorkspaceMutation";
import {
  FormField,
  TextareaField,
} from "@/features/workspaces/components/FormField";
import { ChoiceList } from "@/features/workspaces/components/ChoiceList";
import { ApiFeedback } from "@/features/workspaces/components/ApiFeedback";
import { RoleEditorActions } from "@/features/workspaces/roles/RoleEditorActions";
import { permissionLabels } from "@/features/workspaces/roles/permissionLabels";

const schema = z.object({
  name: workspaceName,
  description: z.string().max(1000),
  permissionCodes: z
    .array(z.string())
    .min(1, "Select at least one permission."),
});
type Values = z.infer<typeof schema>;
const serverFields = ["name", "description", "permissionCodes"] as const;
export function RoleForm({
  scope,
  permissions,
  role,
  onCancel,
}: {
  scope: ScopedOwner;
  permissions: string[];
  role?: Role;
  onCancel: () => void;
}) {
  const {
    register,
    setError,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      name: role?.name ?? "",
      description: role?.description ?? "",
      permissionCodes: role?.permissionCodes ?? [],
    },
  });
  const [revision, setRevision] = useState(role?.version);
  const changed = Boolean(role && revision !== role.version);
  const write = useWorkspaceMutation(
    scope,
    "roles",
    (input: Values, signal) => {
      const body = {
        ...input,
        description: input.description === "" ? null : input.description,
      };
      return role
        ? workspaceApi.updateRole(
            scope,
            scope.workspaceId,
            role.id,
            { ...body, expectedVersion: revision ?? role.version },
            signal,
          )
        : workspaceApi.createRole(scope, scope.workspaceId, body, signal);
    },
  );
  const choices = [
    ...new Set([...(role?.permissionCodes ?? []), ...permissions]),
  ];
  useServerFieldErrors(write.error, setError, serverFields);
  return (
    <form
      noValidate
      onSubmit={(event) => {
        void handleSubmit(async (values) => {
          const saved = await write.run(values);
          if (saved) {
            setRevision(saved.version);
            reset({
              name: saved.name,
              description: saved.description ?? "",
              permissionCodes: saved.permissionCodes,
            });
          }
        })(event);
      }}
      className="flex flex-col gap-4"
    >
      <h3 className="text-lg font-semibold">
        {role ? `Edit ${role.name}` : "Create a custom role"}
      </h3>
      <FormField
        id="role-name"
        label="Role name"
        required
        maxLength={160}
        error={errors.name?.message}
        {...register("name")}
      />
      <TextareaField
        id="role-description"
        label="Description (optional)"
        maxLength={1000}
        error={errors.description?.message}
        {...register("description")}
      />
      <Controller
        control={control}
        name="permissionCodes"
        render={({ field }) => (
          <ChoiceList
            label="Permissions"
            selected={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            firstRef={field.ref}
            options={choices.map((code) => ({
              id: code,
              name: `${permissionLabels[code] ?? code} (${code})`,
              disabled:
                !permissions.includes(code) && !field.value.includes(code),
            }))}
            error={errors.permissionCodes?.message}
          />
        )}
      />
      <p className="text-sm text-muted-foreground">
        Only held, delegable permissions can be added. Existing permissions are
        preserved unless you remove them. The server checks every change.
      </p>
      <ApiFeedback error={write.error} write />
      {changed ? (
        <div className="flex flex-col gap-2">
          <p role="status">
            This role changed while you were editing. Reload its current details
            before saving.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (role) {
                setRevision(role.version);
                reset({
                  name: role.name,
                  description: role.description ?? "",
                  permissionCodes: role.permissionCodes,
                });
              }
            }}
          >
            {isDirty ? "Discard draft and reload role" : "Reload role"}
          </Button>
        </div>
      ) : null}
      {write.isSuccess ? (
        <ApiFeedback>Role details were confirmed by the server.</ApiFeedback>
      ) : null}
      <Button type="submit" disabled={write.isPending || changed}>
        {write.isPending ? "Saving…" : role ? "Save role" : "Create role"}
      </Button>
      <RoleEditorActions
        dirty={isDirty}
        pending={write.isPending}
        onCancel={onCancel}
      />
    </form>
  );
}

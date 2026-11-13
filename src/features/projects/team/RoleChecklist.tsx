import { useId } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PROJECT_ROLE_LABELS } from "@/features/projects/model/roleLabels";
import type { ProjectRoleCode } from "@/features/projects/api/types";
const roles: readonly ProjectRoleCode[] = [
  "ProjectAdministrator",
  "ProjectManager",
  "BusinessAnalyst",
  "Developer",
  "QualityAssurance",
  "DevOps",
  "Viewer",
];
export function RoleChecklist({
  value,
  onChange,
  allowAdministrator,
  forGuest,
  disabled = false,
  error,
  onBlur,
}: {
  value: ProjectRoleCode[];
  onChange: (roles: ProjectRoleCode[]) => void;
  allowAdministrator: boolean;
  forGuest: boolean;
  disabled?: boolean;
  error?: string;
  onBlur?: () => void;
}) {
  const id = useId();
  return (
    <fieldset
      onBlur={onBlur}
      disabled={disabled}
      aria-describedby={error ? `${id}-error` : undefined}
      className="flex flex-col gap-3"
    >
      <legend className="mb-3 text-sm font-medium">Project roles</legend>
      {roles
        .filter(
          (role) =>
            role !== "ProjectAdministrator" ||
            (allowAdministrator && !forGuest),
        )
        .map((role) => (
          <div key={role} className="flex items-center gap-3">
            <Checkbox
              id={`${id}-${role}`}
              checked={value.includes(role)}
              disabled={disabled}
              aria-invalid={!!error}
              onCheckedChange={(checked) => {
                onChange(
                  checked === true
                    ? [...value, role]
                    : value.filter((item) => item !== role),
                );
              }}
            />
            <Label htmlFor={`${id}-${role}`}>{PROJECT_ROLE_LABELS[role]}</Label>
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

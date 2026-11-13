import type { UseFormReturn } from "react-hook-form";
import { ReasonField } from "@/components/ReasonField";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EngagementSelect } from "@/features/projects/components/EngagementSelect";
import {
  changeEngagementForm,
  type ChangeEngagementValues,
} from "@/features/projects/model/settingsForms";
import type { ProjectEngagementRef } from "@/features/projects/api/types";
export function ChangeEngagementFields({
  form,
  engagements,
  blocked,
}: {
  form: UseFormReturn<ChangeEngagementValues>;
  engagements: readonly ProjectEngagementRef[];
  blocked: boolean;
}) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="settings-project-kind">Kind</Label>
        <Select
          value={form.watch("kind")}
          disabled={form.formState.isSubmitting}
          onValueChange={(value) => {
            const kind = changeEngagementForm.shape.kind.safeParse(value);
            if (kind.success) {
              form.setValue("kind", kind.data, { shouldDirty: true });
              if (kind.data === "Internal")
                form.setValue("engagementId", "", { shouldDirty: true });
            }
          }}
        >
          <SelectTrigger id="settings-project-kind">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="Client">Client</SelectItem>
              <SelectItem value="Internal">Internal</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      {form.watch("kind") === "Client" ? (
        <EngagementSelect
          value={form.watch("engagementId")}
          onChange={(value) => {
            form.setValue("engagementId", value, {
              shouldDirty: true,
              shouldValidate: true,
            });
          }}
          onBlur={() => {
            void form.trigger("engagementId");
          }}
          engagements={engagements}
          disabled={form.formState.isSubmitting || blocked}
          error={form.formState.errors.engagementId?.message}
        />
      ) : null}
      <ReasonField
        id="engagement-change-reason"
        required
        value={form.watch("reason")}
        error={form.formState.errors.reason?.message}
        {...form.register("reason")}
      />
    </>
  );
}

import { useState, useRef } from "react";
import { ConfirmAction } from "@/components/ConfirmAction";
import type { Stakeholder } from "@/features/projects/api/types";
import type { StakeholderActions } from "@/features/projects/model/useStakeholderActions";
export function RetireStakeholder({
  stakeholder,
  actions,
  onRetired,
}: {
  stakeholder: Stakeholder;
  actions: StakeholderActions;
  onRetired: () => void;
}) {
  const [error, setError] = useState<unknown>();
  const submitted = useRef(false);
  return (
    <ConfirmAction
      showAuthorityNotice={false}
      label="Retire stakeholder"
      target={stakeholder.name}
      consequence="The entry stays in history. If it is shared with the client, sharing ends."
      reasonMode="none"
      pending={actions.pending}
      error={error}
      onOpenChange={() => {
        setError(undefined);
      }}
      onCloseAutoFocus={(event) => {
        if (submitted.current) {
          event.preventDefault();
          onRetired();
        }
      }}
      onConfirm={async () => {
        submitted.current = true;
        setError(undefined);
        try {
          return (
            (await actions.run(
              {
                action: "retireStakeholder",
                stakeholderId: stakeholder.id,
                expectedVersion: stakeholder.version,
              },
              "Stakeholder retired.",
            )) === "done"
          );
        } catch (failure) {
          submitted.current = false;
          setError(failure);
          return false;
        }
      }}
    />
  );
}

import { useState } from "react";
import type { EngagementDetail } from "@/features/engagements/api/types";
import type { EngagementActions } from "@/features/engagements/model/useEngagementActions";

/** Freeze the version with the form's values; only explicit Reload replaces intent. */
export function useDialogSnapshot(
  engagement: EngagementDetail,
  actions: EngagementActions,
) {
  const [snapshot, setSnapshot] = useState(engagement);
  return {
    snapshot,
    onOpenChange: (open: boolean) => {
      if (open) setSnapshot(engagement);
    },
    reload: async () => {
      const row = await actions.reload();
      setSnapshot(row);
      return row;
    },
  };
}

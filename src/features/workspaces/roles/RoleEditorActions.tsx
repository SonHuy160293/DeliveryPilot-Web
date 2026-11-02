import { useState } from "react";
import { Button } from "@/components/ui/button";

export function RoleEditorActions({
  dirty,
  pending,
  onCancel,
}: {
  dirty: boolean;
  pending: boolean;
  onCancel: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  if (confirming)
    return (
      <div className="flex flex-wrap gap-3">
        <p>Discard your unsaved role changes?</p>
        <Button type="button" variant="outline" onClick={onCancel}>
          Discard changes
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setConfirming(false);
          }}
        >
          Keep editing
        </Button>
      </div>
    );
  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      onClick={() => {
        if (dirty) setConfirming(true);
        else onCancel();
      }}
    >
      Cancel editing
    </Button>
  );
}

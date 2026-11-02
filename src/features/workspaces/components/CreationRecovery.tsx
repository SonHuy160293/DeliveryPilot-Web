import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CreationRecovery({
  uncertain,
  abandon,
  editDetails,
}: {
  uncertain: boolean;
  abandon: () => void;
  editDetails: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  if (!uncertain)
    return (
      <Button variant="outline" type="button" onClick={editDetails}>
        Edit details and start a new attempt
      </Button>
    );
  if (!confirming)
    return (
      <Button
        variant="outline"
        type="button"
        onClick={() => {
          setConfirming(true);
        }}
      >
        Start a new attempt
      </Button>
    );
  return (
    <>
      <p className="text-sm">
        Starting again does not cancel the previous request. Check your
        workspace list first.
      </p>
      <Button variant="outline" type="button" onClick={abandon}>
        Confirm starting again
      </Button>
      <Button
        variant="ghost"
        type="button"
        onClick={() => {
          setConfirming(false);
        }}
      >
        Keep recovery option
      </Button>
    </>
  );
}

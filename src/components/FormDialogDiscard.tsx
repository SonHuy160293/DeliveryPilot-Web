import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function FormDialogDiscard({
  onKeep,
  onDiscard,
}: {
  onKeep: () => void;
  onDiscard: () => void;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Discard changes?</DialogTitle>
        <DialogDescription>
          Your unsaved changes will be lost.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onKeep}>
          Keep editing
        </Button>
        <Button type="button" variant="destructive" onClick={onDiscard}>
          Discard changes
        </Button>
      </DialogFooter>
    </>
  );
}

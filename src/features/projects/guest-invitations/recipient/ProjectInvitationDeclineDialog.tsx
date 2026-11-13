import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ApiFeedback } from "@/components/ApiFeedback";
import { useRateLimit } from "@/lib/api/useRateLimit";
import { RetryDelay } from "@/components/RetryDelay";
export function ProjectInvitationDeclineDialog({
  name,
  pending,
  error,
  onOpenChange,
  onConfirm,
}: {
  name: string;
  pending: boolean;
  error: unknown;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false),
    rate = useRateLimit(error);
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) {
          setOpen(next);
          onOpenChange(next);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" disabled={pending}>
          Decline
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-0 grid-cols-1 break-words">
        <DialogHeader>
          <DialogTitle>Decline invitation: {name}</DialogTitle>
          <DialogDescription>
            This pending invitation will close without joining the project.
          </DialogDescription>
        </DialogHeader>
        <ApiFeedback error={error} write />
        {rate.blocked ? <RetryDelay delay={rate.delay} /> : null}
        <DialogFooter>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => {
              setOpen(false);
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button
            disabled={pending || rate.blocked}
            onClick={() => {
              void onConfirm();
            }}
          >
            {pending ? "Submitting…" : error ? "Try again" : "Decline"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

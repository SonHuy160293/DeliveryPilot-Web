import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/FormField";
import { ApiFeedback } from "@/components/ApiFeedback";
import { RetryDelay } from "@/components/RetryDelay";
import { useRateLimit } from "@/lib/api/useRateLimit";
import { ApiError } from "@/lib/api/apiError";
import {
  linkCodeApi,
  type EngagementScope,
} from "@/features/engagements/api/queries";
import type { LinkPreview } from "@/features/engagements/api/types";
export function LinkCodeForm({
  scope,
  workspaceName,
  onConfirmed,
}: {
  scope: EngagementScope;
  workspaceName: string;
  onConfirmed: () => Promise<void>;
}) {
  const [code, setCode] = useState(""),
    [preview, setPreview] = useState<LinkPreview>(),
    [error, setError] = useState<unknown>(),
    [pending, setPending] = useState(false),
    rate = useRateLimit(error),
    trigger = useRef<HTMLButtonElement>(null);
  const message =
    error instanceof ApiError &&
    error.details.code === "ClientLink.OwnWorkspace"
      ? "A workspace can't link to its own engagement."
      : error instanceof ApiError && error.kind === "validation"
        ? "This code can't be used. Ask the vendor for a new code."
        : "";
  async function check() {
    if (rate.blocked || pending) return;
    setError(undefined);
    setPending(true);
    try {
      setPreview(await linkCodeApi.preview(scope, code));
    } catch (failure) {
      setError(failure);
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            <h3>Confirm a link code</h3>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col items-start gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void check();
            }}
          >
            <FormField
              id="link-code"
              label="Link code"
              required
              autoComplete="off"
              spellCheck={false}
              value={code}
              onChange={(event) => {
                setCode(event.target.value.toUpperCase());
                if (!rate.blocked) setError(undefined);
              }}
              error={message || undefined}
            />
            <Button
              ref={trigger}
              type="submit"
              disabled={pending || rate.blocked}
            >
              Check code
            </Button>
            {rate.blocked ? (
              <>
                <p role="alert">Too many attempts. Try again in 2 minutes.</p>
                <RetryDelay delay={rate.delay} />
              </>
            ) : !message ? (
              <ApiFeedback error={error} />
            ) : null}
          </form>
        </CardContent>
      </Card>
      <Dialog
        open={!!preview}
        onOpenChange={(open) => {
          if (!open && !pending) {
            setPreview(undefined);
            trigger.current?.focus();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm client link</DialogTitle>
            <DialogDescription>
              Confirming links this engagement to {workspaceName} (this
              workspace). No one gains access.
            </DialogDescription>
          </DialogHeader>
          <p>Engagement: {preview?.engagementName ?? "Not named"}</p>
          <p>Client name: {preview?.clientDisplayName}</p>
          <ApiFeedback error={error} write />
          <DialogFooter>
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => {
                setPreview(undefined);
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={pending}
              onClick={() => {
                setPending(true);
                setError(undefined);
                void linkCodeApi
                  .confirm(scope, code)
                  .then(async () => {
                    setPreview(undefined);
                    setCode("");
                    await onConfirmed();
                  })
                  .catch((failure: unknown) => {
                    setError(failure);
                  })
                  .finally(() => {
                    setPending(false);
                  });
              }}
            >
              Confirm link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

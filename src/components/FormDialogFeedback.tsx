import { ApiFeedback } from "@/components/ApiFeedback";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/apiError";

export function FormDialogFeedback({
  error,
  onReload,
  pending,
}: {
  error: unknown;
  onReload?: () => void;
  pending: boolean;
}) {
  if (!(error instanceof ApiError) || error.kind !== "conflict")
    return <ApiFeedback error={error} write />;
  return (
    <Alert variant="destructive" role="alert">
      <AlertDescription className="flex flex-col gap-3">
        <p>Someone else changed this. Reload to see the latest version.</p>
        {!onReload ? (
          <p>Reload is unavailable. Close the form and refresh the page.</p>
        ) : null}
        <Button
          type="button"
          variant="outline"
          onClick={onReload}
          disabled={!onReload || pending}
        >
          Reload
        </Button>
      </AlertDescription>
    </Alert>
  );
}

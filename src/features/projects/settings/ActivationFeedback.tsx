import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProjectActivationError } from "@/features/projects/api/queries";
import { READINESS_LABELS } from "@/features/projects/settings/readinessItems";
export function activationFeedback(error: unknown) {
  return error instanceof ProjectActivationError ? (
    <Alert variant="destructive" role="alert">
      <AlertDescription className="flex flex-col gap-2">
        <p>Complete every required setup step before activating.</p>
        <ul className="list-inside list-disc">
          {error.gaps.map((gap) => (
            <li key={gap}>{READINESS_LABELS[gap]}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  ) : undefined;
}

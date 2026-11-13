import { useLocation } from "react-router";
import { useEffect, useRef } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export interface StatusMessageProps {
  message: string | null;
  onDismiss: () => void;
  mock?: boolean;
}
export function StatusMessage({
  message,
  onDismiss,
  mock = false,
}: StatusMessageProps) {
  const location = useLocation();
  const lastRoute = useRef(location.key);
  useEffect(() => {
    if (lastRoute.current !== location.key) {
      lastRoute.current = location.key;
      if (message !== null) onDismiss();
    }
  }, [location.key, message, onDismiss]);
  if (message === null) return null;
  return (
    <Alert role="status">
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="min-w-0 whitespace-pre-line break-words">
          {message}
          {mock ? " (sample data — not saved to a server)" : ""}
        </span>
        <Button variant="ghost" size="sm" onClick={onDismiss}>
          Dismiss
        </Button>
      </AlertDescription>
    </Alert>
  );
}

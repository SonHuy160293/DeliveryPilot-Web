import { Alert, AlertDescription } from "@/components/ui/alert";

export function MockDataBanner() {
  return (
    <Alert className="border-callout-border bg-callout text-callout-foreground">
      <AlertDescription className="text-callout-foreground">
        Sample data. This page is not connected to the server yet; changes are
        kept only until you reload.
      </AlertDescription>
    </Alert>
  );
}

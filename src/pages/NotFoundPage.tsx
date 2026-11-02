import { Link } from "react-router";
import { PageHeader } from "@/components/PageHeader";
import { PageStateGate, usePagePreviewState } from "@/components/PageStateGate";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";

export function NotFoundPage() {
  const state = usePagePreviewState();
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-12 md:px-6">
      <PageStateGate state={state} scope="Page">
        <PageHeader
          title="Page not found"
          description="This address does not match a DeliveryPilot page. Return home to continue."
        />
        <Button asChild variant="outline">
          <Link to={ROUTES.home}>Return home</Link>
        </Button>
      </PageStateGate>
    </div>
  );
}

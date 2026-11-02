import { Link, useParams } from "react-router";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { PageStateGate, usePagePreviewState } from "@/components/PageStateGate";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";

/** Copy this structure for an approved feature. Do not copy the demo state source
 * into production data-connected screens; use authorized API states instead.
 */
export function BlankPage() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const state = usePagePreviewState();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Workspace overview"
        description="TODO(feature): Replace this placeholder after permission and data contracts are approved."
        breadcrumbs={[
          { label: "Workspaces", to: ROUTES.workspaces },
          { label: "Workspace overview" },
        ]}
      />
      <PageStateGate
        state={state}
        scope="Workspace overview"
        empty={
          <EmptyState
            title="No workspace overview yet"
            description="This feature has no approved content yet. Return to your workspaces."
            action={
              <Button asChild variant="outline">
                <Link to={ROUTES.workspaces}>Back to workspaces</Link>
              </Button>
            }
          />
        }
      >
        <Card>
          <CardContent className="min-h-64 space-y-4 py-8">
            <h2 className="text-lg font-semibold">
              TODO(feature): Content region
            </h2>
            <p className="text-sm text-muted-foreground">
              Route slug: {workspaceSlug ?? "Not supplied"}. A URL does not
              grant access.
            </p>
            <p className="text-sm text-muted-foreground">
              TODO(feature): Replace this area with feature-specific shadcn
              components, authorized data, actions and all required states.
            </p>
          </CardContent>
        </Card>
      </PageStateGate>
    </div>
  );
}

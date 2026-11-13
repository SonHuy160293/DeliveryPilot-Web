import { Link } from "react-router";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader, type PageBreadcrumb } from "@/components/PageHeader";
import { PageStateGate } from "@/components/PageStateGate";
import type { PreviewState } from "@/components/ScreenState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/lib/routes";

/** BlankPage composition for unconnected routes; no preview query or data reads. */
export function FeaturePlaceholderPage({
  title,
  breadcrumbs,
  state = "ready",
}: {
  title: string;
  breadcrumbs: readonly PageBreadcrumb[];
  state?: PreviewState;
}) {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={title}
        description="TODO(feature): Replace this placeholder after permission and data contracts are approved."
        breadcrumbs={breadcrumbs}
      />
      <PageStateGate
        state={state}
        scope={title}
        empty={
          <EmptyState
            title="Nothing to show yet"
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
          <CardContent className="flex min-h-64 flex-col gap-4 py-8">
            <h2 className="text-lg font-semibold">
              TODO(feature): Content region
            </h2>
            <p className="text-sm text-muted-foreground">
              A URL does not grant access.
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

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { z } from "zod";
import { FormDialog } from "@/components/FormDialog";
import { Button } from "@/components/ui/button";
import {
  portalKey,
  portalWriteMutation,
  assertPortalScope,
  type PortalScope,
} from "@/features/portal/api/queries";
import { ROUTES } from "@/lib/routes";
export function LeaveGuestProject({
  scope,
  projectId,
  name,
}: {
  scope: PortalScope;
  projectId: string;
  name: string;
}) {
  const mutation = useMutation(portalWriteMutation(scope, projectId)),
    client = useQueryClient(),
    navigate = useNavigate();
  return (
    <FormDialog
      title={`Leave project: ${name}`}
      description="You will lose access to this project immediately."
      trigger={<Button variant="outline">Leave project</Button>}
      submitLabel="Leave project"
      schema={z.object({})}
      defaultValues={{}}
      onSubmit={async () => {
        await mutation.mutateAsync({ action: "leave" });
        assertPortalScope(scope);
        await client.cancelQueries({ queryKey: portalKey(scope) });
        client.removeQueries({ queryKey: portalKey(scope) });
        await navigate(ROUTES.portal, {
          replace: true,
          state: { leftProject: name },
        });
        return "done";
      }}
    >
      {() => null}
    </FormDialog>
  );
}

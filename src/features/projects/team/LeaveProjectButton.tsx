import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { z } from "zod";
import { FormDialog } from "@/components/FormDialog";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import {
  leaveProjectMutation,
  isCurrentProjectScope,
  type ProjectScope,
} from "@/features/projects/api/queries";
export function LeaveProjectButton({
  scope,
  projectId,
  projectName,
}: {
  scope: Pick<ProjectScope, "accountId" | "generation">;
  projectId: string;
  projectName: string;
}) {
  const mutation = useMutation(leaveProjectMutation(scope, projectId)),
    client = useQueryClient(),
    navigate = useNavigate();
  return (
    <FormDialog
      title={`Leave project: ${projectName}`}
      description="You will lose access to this project immediately."
      trigger={<Button variant="outline">Leave project</Button>}
      submitLabel="Leave project"
      schema={z.object({})}
      defaultValues={{}}
      onSubmit={async () => {
        await mutation.mutateAsync();
        if (!isCurrentProjectScope(scope)) return "keep-open";
        // Guest access ends immediately, including any mounted portal project cache.
        await client.cancelQueries({
          queryKey: ["account", scope.accountId, "portal"],
        });
        client.removeQueries({
          queryKey: ["account", scope.accountId, "portal"],
        });
        await navigate(ROUTES.portal, { replace: true });
        return "done";
      }}
    >
      {() => null}
    </FormDialog>
  );
}

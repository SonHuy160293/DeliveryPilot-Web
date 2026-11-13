import { useQuery } from "@tanstack/react-query";
import { ReadState } from "@/components/ReadState";
import {
  portalPreviewQuery,
  type PortalScope,
} from "@/features/portal/api/queries";
import { PortalProjectView } from "@/features/portal/components/PortalProjectView";
export function PortalPreview({
  scope,
  projectId,
}: {
  scope: PortalScope & { workspaceId: string };
  projectId: string;
}) {
  const options = portalPreviewQuery(scope, projectId),
    query = useQuery(options);
  return (
    <ReadState query={query} queryKey={options.queryKey} scope="Client preview">
      {query.data ? <PortalProjectView view={query.data} preview /> : null}
    </ReadState>
  );
}

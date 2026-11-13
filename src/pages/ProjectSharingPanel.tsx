import { ProjectSharingTab } from "@/features/sharing/ProjectSharingTab";
import { PortalPreview } from "@/features/portal/components/PortalPreview";
import type { ProjectTeamProps } from "@/features/projects/team/types";
export function ProjectSharingPanel(props: ProjectTeamProps) {
  return <ProjectSharingTab {...props} PreviewComponent={PortalPreview} />;
}

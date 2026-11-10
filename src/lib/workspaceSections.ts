/** In-page workspace sections, addressed by a search parameter on the approved workspace route. */
export const WORKSPACE_SECTION_PARAM = "section";

export const WORKSPACE_SECTIONS = [
  { value: "overview", label: "Overview" },
  { value: "members", label: "Members" },
  { value: "roles", label: "Roles" },
  { value: "invitations", label: "Invitations" },
  { value: "ownership", label: "Ownership" },
  { value: "audit", label: "Audit" },
] as const;

export type WorkspaceSection = (typeof WORKSPACE_SECTIONS)[number]["value"];

export function readWorkspaceSection(
  params: URLSearchParams,
): WorkspaceSection {
  const value = params.get(WORKSPACE_SECTION_PARAM);
  return (
    WORKSPACE_SECTIONS.find((section) => section.value === value)?.value ??
    "overview"
  );
}

export function workspaceSectionSearch(section: WorkspaceSection): string {
  return section === "overview"
    ? ""
    : `?${new URLSearchParams({ [WORKSPACE_SECTION_PARAM]: section }).toString()}`;
}

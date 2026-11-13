import { lazy, Suspense, useState } from "react";
import { useSearchParams } from "react-router";
import { ScreenState } from "@/components/ScreenState";
import { EmptyState } from "@/components/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Member } from "@/features/workspaces/api/contracts";
import type { ScopedOwner } from "@/features/workspaces/api/queries";
import {
  WORKSPACE_SECTIONS,
  WORKSPACE_SECTION_PARAM,
  readWorkspaceSection,
  type WorkspaceSection,
} from "@/lib/workspaceSections";
import { OwnMembership } from "@/features/workspaces/components/OwnMembership";
import { useWorkspaceNavigation } from "@/features/workspaces/model/useWorkspaceNavigation";
import type { WorkspaceExtraPanels } from "@/features/workspaces/components/workspaceExtraPanels";

const Members = lazy(
  () => import("@/features/workspaces/members/MembersPanel"),
);
const Roles = lazy(() => import("@/features/workspaces/roles/RolesPanel"));
const Invitations = lazy(
  () => import("@/features/workspaces/invitations/InvitationsPanel"),
);
const Ownership = lazy(
  () => import("@/features/workspaces/ownership/OwnershipPanel"),
);
const Audit = lazy(() => import("@/features/workspaces/audit/AuditPanel"));
const panels: readonly {
  value: WorkspaceSection;
  label: string;
  Component: typeof Members;
}[] = [
  { value: "members", label: "Members", Component: Members },
  { value: "roles", label: "Roles", Component: Roles },
  { value: "invitations", label: "Invitations", Component: Invitations },
  { value: "ownership", label: "Ownership", Component: Ownership },
  { value: "audit", label: "Audit", Component: Audit },
];
export function WorkspacePanels({
  scope,
  me,
  workspaceName = "Workspace",
  extraPanels,
}: {
  scope: ScopedOwner;
  me: Member;
  workspaceName?: string;
  extraPanels?: WorkspaceExtraPanels;
}) {
  const [params, setParams] = useSearchParams();
  const section = readWorkspaceSection(params);
  const navigation = useWorkspaceNavigation(scope, me);
  const sections = WORKSPACE_SECTIONS.filter(
    ({ value }) =>
      (value !== "client-links" || navigation.clientLinks) &&
      (value !== "projects-recovery" || navigation.projectRecovery),
  );
  const [rolesVisited, setRolesVisited] = useState(false);
  // Keep the roles editor mounted once opened, however it was reached (tab or sidebar link).
  if (section === "roles" && !rolesVisited) setRolesVisited(true);
  if (!sections.some(({ value }) => value === section))
    return (
      <ScreenState
        status="no-permission"
        scope="Workspace section"
        presentation={{
          title: "Access unavailable",
          description:
            section === "client-links"
              ? "Only workspace Owners and Admins can manage client links."
              : section === "projects-recovery"
                ? "Only workspace Owners can recover projects."
                : "This workspace section is not available to your current membership.",
        }}
      />
    );
  return (
    <Tabs
      value={section}
      onValueChange={(next) => {
        setParams((current) => {
          const updated = new URLSearchParams(current);
          if (next === "overview") updated.delete(WORKSPACE_SECTION_PARAM);
          else updated.set(WORKSPACE_SECTION_PARAM, next);
          return updated;
        });
      }}
      activationMode="manual"
    >
      <TabsList
        aria-label="Workspace sections"
        className="w-full flex-nowrap justify-start overflow-x-auto md:hidden"
      >
        {sections.map((item) => (
          <TabsTrigger key={item.value} value={item.value}>
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="overview">
        <p className="mb-6 text-sm text-muted-foreground">
          A workspace brings people together around delivery work. Project
          access is managed separately.
        </p>
        <OwnMembership scope={scope} me={me} />
      </TabsContent>
      {panels.map(({ value, label, Component }) => (
        <TabsContent
          key={value}
          value={value}
          forceMount={value === "roles" && rolesVisited ? true : undefined}
          hidden={value === "roles" && rolesVisited && section !== value}
        >
          <Suspense fallback={<ScreenState status="loading" scope={label} />}>
            <Component scope={scope} />
          </Suspense>
        </TabsContent>
      ))}
      {WORKSPACE_SECTIONS.filter(
        ({ value }) =>
          value === "client-links" || value === "projects-recovery",
      ).map(({ value, label }) => (
        <TabsContent key={value} value={value}>
          {value === "client-links" && extraPanels?.clientLinks ? (
            <extraPanels.clientLinks
              scope={scope}
              workspaceName={workspaceName}
            />
          ) : value === "projects-recovery" && extraPanels?.projectRecovery ? (
            <extraPanels.projectRecovery
              scope={scope}
              workspaceName={workspaceName}
            />
          ) : (
            <EmptyState
              title={label}
              description="TODO(feature): Replace this placeholder after permission and data contracts are approved. Return to the workspace overview to continue."
            />
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}

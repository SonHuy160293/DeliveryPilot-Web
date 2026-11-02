import { lazy, Suspense, useState } from "react";
import { ScreenState } from "@/components/ScreenState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Member } from "@/features/workspaces/api/contracts";
import type { ScopedOwner } from "@/features/workspaces/api/queries";
import { OwnMembership } from "@/features/workspaces/components/OwnMembership";
import { Button } from "@/components/ui/button";

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
const panels = [
  { value: "members", label: "Members", Component: Members },
  { value: "roles", label: "Roles", Component: Roles },
  { value: "invitations", label: "Invitations", Component: Invitations },
  { value: "ownership", label: "Ownership", Component: Ownership },
  { value: "audit", label: "Audit", Component: Audit },
];
export function WorkspacePanels({
  scope,
  me,
}: {
  scope: ScopedOwner;
  me: Member;
}) {
  const [section, setSection] = useState("overview");
  const [rolesVisited, setRolesVisited] = useState(false);
  return (
    <Tabs
      value={section}
      onValueChange={(next) => {
        if (next === "roles") setRolesVisited(true);
        setSection(next);
      }}
      activationMode="manual"
    >
      <TabsList
        aria-label="Workspace sections"
        className="w-full flex-nowrap justify-start overflow-x-auto"
      >
        <TabsTrigger value="overview">Overview</TabsTrigger>
        {panels.map((panel) => (
          <TabsTrigger key={panel.value} value={panel.value}>
            {panel.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="overview">
        <p className="mb-4 text-sm text-muted-foreground">
          A workspace brings people together around delivery work. Project
          access is managed separately.
        </p>
        <OwnMembership scope={scope} me={me} />
        <section
          className="mt-6 flex flex-col gap-3"
          aria-label="Workspace sections"
        >
          <h2 className="text-lg font-semibold">Explore this workspace</h2>
          <div className="flex flex-wrap gap-3">
            {panels.map((panel) => (
              <Button
                key={panel.value}
                type="button"
                variant="outline"
                onClick={() => {
                  if (panel.value === "roles") setRolesVisited(true);
                  setSection(panel.value);
                }}
              >
                {panel.label}
              </Button>
            ))}
          </div>
        </section>
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
    </Tabs>
  );
}

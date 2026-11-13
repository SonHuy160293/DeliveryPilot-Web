import { useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import type { Member } from "@/features/workspaces/api/contracts";
import type { ScopedOwner } from "@/features/workspaces/api/queries";
import { RoleBadges } from "@/features/workspaces/components/RoleBadges";
import { MemberActions } from "@/features/workspaces/members/MemberActions";
import { formatInstant } from "@/lib/format";
import { useWorkspaceNavigation } from "@/features/workspaces/model/useWorkspaceNavigation";
import { workspaceProjectsPath, workspaceEngagementsPath } from "@/lib/routes";

export function OwnMembership({
  scope,
  me,
}: {
  scope: ScopedOwner;
  me: Member;
}) {
  const [managing, setManaging] = useState(false);
  const navigation = useWorkspaceNavigation(scope, me);
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Your membership</h2>
      <p className="break-words">{me.displayName}</p>
      <RoleBadges roles={me.roles} />
      <p className="text-sm">Joined {formatInstant(me.joinedAt)}.</p>
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" asChild>
          <Link to={workspaceProjectsPath(scope.workspaceId)}>
            View projects
          </Link>
        </Button>
        {navigation.engagements ? (
          <Button variant="outline" asChild>
            <Link to={workspaceEngagementsPath(scope.workspaceId)}>
              View engagements
            </Link>
          </Button>
        ) : null}
      </div>
      <Button
        variant="outline"
        aria-expanded={managing}
        aria-controls="own-membership-actions"
        onClick={() => {
          setManaging((value) => !value);
        }}
      >
        Manage my membership
      </Button>
      {managing ? (
        <div id="own-membership-actions">
          <MemberActions key={String(me.version)} scope={scope} member={me} />
        </div>
      ) : null}
    </section>
  );
}

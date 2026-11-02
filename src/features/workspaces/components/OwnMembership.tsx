import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Member } from "@/features/workspaces/api/contracts";
import type { ScopedOwner } from "@/features/workspaces/api/queries";
import { RoleBadges } from "@/features/workspaces/components/RoleBadges";
import { MemberActions } from "@/features/workspaces/members/MemberActions";
import { formatInstant } from "@/features/workspaces/model/formatters";

export function OwnMembership({
  scope,
  me,
}: {
  scope: ScopedOwner;
  me: Member;
}) {
  const [managing, setManaging] = useState(false);
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Your membership</h2>
      <p className="break-words">{me.displayName}</p>
      <RoleBadges roles={me.roles} />
      <p className="text-sm">Joined {formatInstant(me.joinedAt)}.</p>
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

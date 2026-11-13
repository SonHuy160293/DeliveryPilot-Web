import type { ReactNode } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { statusTone } from "@/lib/statusTone";
import { roles } from "@/features/portal/components/labels";
import { SharedItems } from "@/features/portal/components/SharedItems";
import type { GuestProjectView } from "@/features/portal/api/types";
export function PortalProjectView({
  view,
  actions,
  preview = false,
}: {
  view: GuestProjectView;
  actions?: ReactNode;
  preview?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-semibold">{view.name}</h2>
        <StatusBadge label={view.status} tone={statusTone(view.status)} />
      </div>
      <p>{view.purpose}</p>
      <section aria-label="Facts">
        <Card>
          <CardHeader>
            <CardTitle>
              <h3>Facts</h3>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Sprint length {view.sprintLengthWeeks}{" "}
              {view.sprintLengthWeeks === 1 ? "week" : "weeks"}
            </p>
            {!preview ? (
              <p>
                Your roles {view.myRoles.map((role) => roles[role]).join(", ")}
              </p>
            ) : null}
            <p>
              Client PO {view.clientProductOwnerName?.trim() || "Not recorded"}
            </p>
          </CardContent>
        </Card>
      </section>
      <section aria-label="Product Goal">
        <Card>
          <CardHeader>
            <CardTitle>
              <h3>Product Goal</h3>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{view.productGoal?.trim() || "Not yet written"}</p>
          </CardContent>
        </Card>
      </section>
      <section aria-label="Team" className="space-y-3">
        <h2 className="text-xl font-semibold">Team</h2>
        <ul className="space-y-2">
          {view.team.map((person, index) => (
            <li
              key={`${person.displayName ?? "person"}-${String(index)}`}
              className="break-words"
            >
              {person.displayName?.trim() || "Name unavailable"} —{" "}
              {person.roles.map((role) => roles[role]).join(", ")}
              {person.isGuest ? " · Guest" : ""}
              {person.isClientProductOwner ? " · Client PO" : ""}
            </li>
          ))}
        </ul>
      </section>
      <SharedItems view={view} />
      {actions}
    </div>
  );
}

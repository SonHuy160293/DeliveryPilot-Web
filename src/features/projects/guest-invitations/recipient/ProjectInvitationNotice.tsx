import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
const messages = {
  unavailable:
    "This invitation can no longer be used. Ask the project team to send a new one.",
  mismatch:
    "This invitation is for a different email address. Sign out and sign in with the invited address.",
  member:
    "You're a member of this vendor's workspace. Ask a project administrator to add you to the team instead.",
  declined: "You declined the invitation.",
} as const;
export function ProjectInvitationNotice({
  kind,
  onSignOut,
}: {
  kind: keyof typeof messages;
  onSignOut: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [kind]);
  return (
    <div className="flex flex-col gap-4">
      <h2
        ref={heading}
        tabIndex={-1}
        className="break-words text-xl font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {messages[kind]}
      </h2>
      {kind === "mismatch" ? (
        <Button variant="outline" onClick={onSignOut}>
          Sign out
        </Button>
      ) : null}
      {kind === "declined" ? (
        <>
          <p className="text-sm text-muted-foreground">
            (sample data — not saved to a server)
          </p>
          <Button variant="outline" asChild>
            <Link to={ROUTES.portal}>Go to client portal</Link>
          </Button>
        </>
      ) : null}
    </div>
  );
}

import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
export function ProjectInvitationSignedOut() {
  return (
    <div className="flex flex-col gap-4">
      <p>Sign in with the email address this invitation was sent to.</p>
      <Button asChild>
        <Link to={ROUTES.signIn} state={{ from: ROUTES.joinProject }}>
          Continue to sign in
        </Link>
      </Button>
    </div>
  );
}

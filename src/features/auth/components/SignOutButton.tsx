import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { authSession } from "@/lib/api/authSession";
import { clearSessionCache } from "@/lib/query/queryScope";
import { ROUTES } from "@/lib/routes";

export function SignOutButton() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  function signOut() {
    void navigate(ROUTES.signIn, {
      replace: true,
      state: { localSignOut: true },
    });
    authSession.clear(true);
    void clearSessionCache(queryClient);
  }
  return (
    <Button type="button" variant="outline" onClick={signOut}>
      Sign out
    </Button>
  );
}

import { Navigate, Outlet, useLocation } from "react-router";
import { useAuthSession } from "@/lib/api/useAuthSession";
import { ROUTES } from "@/lib/routes";

/** The server remains the authorization authority; this guard only manages navigation. */
export function RequireAuth() {
  const session = useAuthSession();
  const location = useLocation();
  if (session.status !== "authenticated") {
    return (
      <Navigate
        to={ROUTES.signIn}
        replace
        state={{ from: location.pathname, localSignOut: session.localSignOut }}
      />
    );
  }
  return <Outlet />;
}
export function AnonymousOnly({
  children,
  resolveRedirect,
}: {
  children: React.ReactNode;
  resolveRedirect?: () => string | undefined;
}) {
  const session = useAuthSession();
  const redirect = resolveRedirect?.();
  return session.status === "authenticated" ? (
    <Navigate
      to={
        redirect === ROUTES.joinWorkspace || redirect === ROUTES.joinProject
          ? redirect
          : ROUTES.workspaces
      }
      replace
    />
  ) : (
    children
  );
}

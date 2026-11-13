import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router";
import { ProjectInvitationContext } from "@/features/projects/guest-invitations/recipient/invitationContext";
import {
  createProjectInvitationFlow,
  type ProjectInvitationFlow,
} from "@/features/projects/guest-invitations/recipient/invitationFlow";
import { authSession } from "@/lib/api/authSession";
import { ROUTES } from "@/lib/routes";
export function ProjectInvitationFlowBoundary({
  initial,
  children,
}: {
  initial?: ProjectInvitationFlow;
  children: ReactNode;
}) {
  // Bootstrap owns capture; the boundary never imports a proof-bearing URL into React state.
  const [flow] = useState(() => initial ?? createProjectInvitationFlow());
  const lifecycle = useRef({ generation: 0 }),
    location = useLocation(),
    navigate = useNavigate();
  useEffect(() => {
    const counter = lifecycle.current,
      current = ++counter.generation;
    return () => {
      queueMicrotask(() => {
        if (counter.generation === current) flow.clear();
      });
    };
  }, [flow]);
  useLayoutEffect(() => {
    if (location.pathname === ROUTES.joinProject && location.hash)
      void navigate(
        { pathname: location.pathname, search: location.search, hash: "" },
        { replace: true },
      );
  }, [location.pathname, location.hash, location.search, navigate]);
  useEffect(() => {
    if (
      location.pathname !== ROUTES.joinProject &&
      location.pathname !== ROUTES.signIn
    )
      flow.clear();
  }, [flow, location.pathname]);
  useEffect(
    () =>
      authSession.subscribe(() => {
        const current = authSession.getSnapshot();
        if (current.status === "anonymous" && current.localSignOut)
          flow.clear();
        else flow.retire();
      }),
    [flow],
  );
  return (
    <ProjectInvitationContext value={flow}>{children}</ProjectInvitationContext>
  );
}

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router";
import { InvitationContext } from "@/features/workspaces/recipient/invitationContext";
import {
  createInvitationFlow,
  parseInvitationFragment,
  type InvitationFlow,
} from "@/features/workspaces/recipient/invitationFlow";
import { authSession } from "@/lib/api/authSession";
import { ROUTES } from "@/lib/routes";

export function InvitationFlowBoundary({
  initial,
  children,
}: {
  initial?: InvitationFlow;
  children: ReactNode;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [flow] = useState(
    () =>
      initial ??
      createInvitationFlow(
        location.pathname === ROUTES.joinWorkspace
          ? parseInvitationFragment(location.hash)
          : undefined,
      ),
  );
  const lifecycle = useRef({ generation: 0 });
  useEffect(() => {
    const counter = lifecycle.current;
    const current = ++counter.generation;
    return () => {
      queueMicrotask(() => {
        if (counter.generation === current) flow.clear();
      });
    };
  }, [flow]);
  useLayoutEffect(() => {
    if (location.pathname === ROUTES.joinWorkspace && location.hash)
      void navigate(
        { pathname: location.pathname, search: location.search, hash: "" },
        { replace: true },
      );
  }, [location.pathname, location.hash, location.search, navigate]);
  useEffect(() => {
    if (
      location.pathname !== ROUTES.joinWorkspace &&
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
  return <InvitationContext value={flow}>{children}</InvitationContext>;
}

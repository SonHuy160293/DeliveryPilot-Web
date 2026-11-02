import { useRef, useState, type MouseEvent } from "react";
import { useLocation } from "react-router";
import type { SessionOwner } from "@/features/workspaces/api/request";
import { WorkspaceCreateDialog } from "@/features/workspaces/WorkspaceCreateDialog";
import { WorkspaceCollection } from "@/features/workspaces/components/WorkspaceCollection";
import { ApiFeedback } from "@/features/workspaces/components/ApiFeedback";
import { PersonalNominations } from "@/features/workspaces/ownership/PersonalNominations";
import { isRecord } from "@/lib/api/errorNormalizer";

export function WorkspacePortfolio({ owner }: { owner: SessionOwner }) {
  const location = useLocation();
  const [creating, setCreating] = useState(false);
  const returnFocus = useRef<HTMLButtonElement | null>(null);
  const portfolioFocus = useRef<HTMLElement | null>(null);
  function openCreation(event: MouseEvent<HTMLButtonElement>) {
    returnFocus.current = event.currentTarget;
    setCreating(true);
  }
  return (
    <section
      ref={portfolioFocus}
      tabIndex={-1}
      aria-label="Workspace portfolio"
      className="flex flex-col gap-6 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <WorkspaceCreateDialog
        owner={owner}
        open={creating}
        onOpenChange={setCreating}
        returnFocusRef={returnFocus}
        fallbackFocusRef={portfolioFocus}
      />
      {isRecord(location.state) && location.state.workspaceDenied === true ? (
        <ApiFeedback kind="info">
          The selected workspace is unavailable under your current membership.
          Choose another workspace or ask a manager to review access.
        </ApiFeedback>
      ) : null}
      <PersonalNominations owner={owner} />
      <WorkspaceCollection owner={owner} onCreate={openCreation} />
      <p className="text-sm text-muted-foreground">
        Workspaces are separate spaces. You only see information your membership
        permits.
      </p>
    </section>
  );
}

import { useRef, useState, type MouseEvent } from "react";
import { Plus } from "lucide-react";
import { useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import type { SessionOwner } from "@/features/workspaces/api/request";
import { WorkspaceCreateDialog } from "@/features/workspaces/WorkspaceCreateDialog";
import { ApiFeedback } from "@/components/ApiFeedback";
import { PortfolioStats } from "@/features/workspaces/components/PortfolioStats";
import { WorkspaceCollection } from "@/features/workspaces/components/WorkspaceCollection";
import {
  PERSONAL_NOMINATIONS_ID,
  PersonalNominations,
} from "@/features/workspaces/ownership/PersonalNominations";
import { isRecord } from "@/lib/api/errorNormalizer";

export function WorkspacePortfolio({ owner }: { owner: SessionOwner }) {
  const location = useLocation();
  const [creating, setCreating] = useState(false);
  const returnFocus = useRef<HTMLButtonElement | null>(null);
  const portfolioFocus = useRef<HTMLElement | null>(null);
  function reviewNominations() {
    const target = document.getElementById(PERSONAL_NOMINATIONS_ID);
    target?.scrollIntoView({ block: "start" });
    target?.focus({ preventScroll: true });
  }
  function openCreation(event: MouseEvent<HTMLButtonElement>) {
    returnFocus.current = event.currentTarget;
    setCreating(true);
  }
  return (
    <section
      ref={portfolioFocus}
      tabIndex={-1}
      aria-label="Workspace portfolio"
      className="flex flex-col gap-8 focus-visible:ring-2 focus-visible:ring-ring md:gap-12"
    >
      <WorkspaceCreateDialog
        owner={owner}
        open={creating}
        onOpenChange={setCreating}
        returnFocusRef={returnFocus}
        fallbackFocusRef={portfolioFocus}
      />
      <div className="flex flex-col gap-6 md:gap-8">
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-bold tracking-tighter md:text-4xl">
              Your workspaces
            </h1>
            <p className="text-sm text-muted-foreground">
              One place for every team you work with. Choose where to pick up
              next.
            </p>
          </div>
          <Button
            type="button"
            className="min-h-12 w-full gap-3 font-bold md:w-auto"
            onClick={openCreation}
          >
            <Plus aria-hidden="true" />
            <span>Create workspace</span>
          </Button>
        </header>
        {isRecord(location.state) && location.state.workspaceDenied === true ? (
          <ApiFeedback kind="info">
            The selected workspace is unavailable under your current membership.
            Choose another workspace or ask a manager to review access.
          </ApiFeedback>
        ) : null}
        <PersonalNominations owner={owner} />
        <PortfolioStats owner={owner} onReviewNominations={reviewNominations} />
      </div>
      <WorkspaceCollection owner={owner} onCreate={openCreation} />
      <p className="text-sm text-muted-foreground">
        Workspaces are separate spaces. You only see information your membership
        permits.
      </p>
    </section>
  );
}

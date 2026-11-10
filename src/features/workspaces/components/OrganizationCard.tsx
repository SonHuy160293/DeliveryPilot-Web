import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Workspace } from "@/features/workspaces/api/contracts";
import {
  isManagedWorkspace,
  isOwnedWorkspace,
  type PortfolioView,
} from "@/features/workspaces/model/portfolio";
import { workspaceOverviewPath } from "@/lib/routes";
import { cn } from "@/lib/utils";

const AVATAR_TONES = [
  "bg-avatar-1 text-avatar-1-foreground",
  "bg-avatar-2 text-avatar-2-foreground",
  "bg-avatar-3 text-avatar-3-foreground",
  "bg-avatar-4 text-avatar-4-foreground",
  "bg-avatar-5 text-avatar-5-foreground",
  "bg-avatar-6 text-avatar-6-foreground",
] as const;

function getOrganizationInitials(name: string): string {
  const [firstWord, secondWord] = name.trim().split(/\s+/).filter(Boolean);
  if (!firstWord) return "?";
  if (!secondWord) {
    return (Array.from(firstWord)[0] ?? "?").toLocaleUpperCase();
  }
  const first = Array.from(firstWord)[0] ?? "";
  const second = Array.from(secondWord)[0] ?? "";
  return `${first}${second}`.toLocaleUpperCase() || "?";
}

function getAvatarToneClass(seed: string): string {
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + (char.codePointAt(0) ?? 0)) >>> 0;
  }
  return (
    AVATAR_TONES[hash % AVATAR_TONES.length] ??
    "bg-avatar-1 text-avatar-1-foreground"
  );
}

function RolePill({ workspace }: { workspace: Workspace }) {
  const [primary, ...others] = workspace.roles;
  if (!primary) return null;
  return (
    <Badge
      variant="secondary"
      className={cn(
        "max-w-full min-w-0 shrink rounded-lg px-3 text-xs font-bold",
        isOwnedWorkspace(workspace) && "bg-accent text-accent-foreground",
      )}
    >
      <span className="sr-only">Your roles: </span>
      <span className="truncate">{primary.name}</span>
      {others.length ? (
        <>
          <span aria-hidden="true">+{String(others.length)}</span>
          <span className="sr-only">
            , {others.map((role) => role.name).join(", ")}
          </span>
        </>
      ) : null}
    </Badge>
  );
}

export function OrganizationCard({
  workspace,
  view = "grid",
}: {
  workspace: Workspace;
  view?: PortfolioView;
}) {
  const list = view === "list";
  return (
    <Card
      className={cn(
        "relative min-w-0 gap-4 overflow-hidden p-6 shadow-none transition-colors duration-150 ease-out hover:border-brand",
        list && "md:flex-row md:items-center md:gap-6 md:py-4",
      )}
    >
      {isOwnedWorkspace(workspace) ? (
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-x-6 top-0 h-1 rounded-b-md bg-brand",
            list && "md:inset-x-auto md:inset-y-4 md:left-0 md:h-auto md:w-1",
          )}
        />
      ) : null}
      <div
        className={cn(
          "flex min-w-0 items-center justify-between gap-3",
          list && "md:w-56 md:shrink-0 md:justify-start",
        )}
      >
        <span
          aria-hidden="true"
          className={`flex size-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold tracking-tight ${getAvatarToneClass(workspace.name)}`}
        >
          {getOrganizationInitials(workspace.name)}
        </span>
        <RolePill workspace={workspace} />
      </div>
      <h3 className="line-clamp-2 min-w-0 flex-1 text-lg leading-snug font-bold tracking-tight break-words text-card-foreground">
        {workspace.name}
      </h3>
      <div
        className={cn(
          "mt-auto flex items-center justify-between gap-2 border-t border-border pt-3",
          list && "md:mt-0 md:shrink-0 md:gap-6 md:border-t-0 md:pt-0",
        )}
      >
        <p className="min-w-0 truncate text-sm text-muted-foreground">
          {isOwnedWorkspace(workspace)
            ? "You own this workspace"
            : isManagedWorkspace(workspace)
              ? "You manage this workspace"
              : "Member"}
        </p>
        <Button
          asChild
          variant="link"
          className="gap-1 px-0 font-bold text-brand-strong has-[>svg]:px-0"
        >
          <Link
            aria-label={`Open workspace ${workspace.name}`}
            to={workspaceOverviewPath(workspace.organizationId)}
          >
            <span>Open workspace</span>
            <ArrowUpRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}

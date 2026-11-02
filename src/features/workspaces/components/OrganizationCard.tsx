import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Workspace } from "@/features/workspaces/api/contracts";
import { workspaceOverviewPath } from "@/lib/routes";

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

export function OrganizationCard({ workspace }: { workspace: Workspace }) {
  const initials = getOrganizationInitials(workspace.name);
  const avatarTone = getAvatarToneClass(workspace.name);

  return (
    <Card className="min-w-0 justify-between gap-4 rounded-xl border border-border bg-card py-4 shadow-sm transition-colors duration-150 ease-out hover:border-ring md:py-6">
      <CardHeader className="px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <div
            aria-hidden="true"
            className={`flex size-12 shrink-0 items-center justify-center rounded-xl text-base font-bold shadow-sm ${avatarTone}`}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle>
              <h3 className="line-clamp-2 break-words text-lg font-semibold leading-snug text-card-foreground">
                {workspace.name}
              </h3>
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardFooter className="px-4 pt-2 sm:px-6">
        <Button
          asChild
          variant="secondary"
          className="min-h-11 w-full max-w-full justify-center whitespace-normal bg-accent text-accent-foreground transition-colors duration-150 ease-out hover:bg-primary hover:text-primary-foreground"
        >
          <Link
            aria-label={`Open workspace ${workspace.name}`}
            to={workspaceOverviewPath(workspace.organizationId)}
          >
            <span>Open workspace</span>
            <ArrowUpRight aria-hidden="true" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

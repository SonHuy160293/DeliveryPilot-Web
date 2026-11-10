import {
  Crown,
  KeyRound,
  Layers,
  LayoutDashboard,
  MailPlus,
  ScrollText,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Link, useMatch, useSearchParams } from "react-router";
import { ROUTES, workspaceOverviewPath } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { BrandMark, BrandWord } from "@/layouts/Brand";
import { NavGroup, NavItem } from "@/layouts/SidebarNav";
import { revealClass } from "@/layouts/revealClass";
import {
  WORKSPACE_SECTIONS,
  readWorkspaceSection,
  workspaceSectionSearch,
  type WorkspaceSection,
} from "@/lib/workspaceSections";

export const APP_SIDEBAR_ID = "app-sidebar";

const SECTION_ICONS: Record<WorkspaceSection, LucideIcon> = {
  overview: LayoutDashboard,
  members: Users,
  roles: KeyRound,
  invitations: MailPlus,
  ownership: Crown,
  audit: ScrollText,
};

/** Shared by the desktop rail and the mobile Sheet. */
export function SidebarContent({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const portfolio = useMatch(ROUTES.workspaces);
  const workspace = useMatch(ROUTES.workspaceOverview);
  const [params] = useSearchParams();
  const slug = workspace?.params.workspaceSlug;
  const section = readWorkspaceSection(params);
  return (
    <div className="flex flex-col gap-6 overflow-hidden">
      <Link
        to={ROUTES.workspaces}
        title={collapsed ? "DeliveryPilot" : undefined}
        onClick={onNavigate}
        className="flex min-h-12 items-center gap-3 rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        <BrandMark />
        <span
          className={cn(
            "flex flex-col text-lg leading-tight",
            revealClass(collapsed),
          )}
        >
          <BrandWord />
          <span
            aria-hidden="true"
            className="text-xs font-bold tracking-widest text-muted-foreground uppercase"
          >
            Delivery platform
          </span>
        </span>
      </Link>
      <NavGroup label="Main menu" collapsed={collapsed}>
        <NavItem
          to={ROUTES.workspaces}
          label="Workspaces"
          Icon={Layers}
          active={Boolean(portfolio)}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      </NavGroup>
      {slug ? (
        <NavGroup label="This workspace" collapsed={collapsed}>
          {WORKSPACE_SECTIONS.map(({ value, label }) => (
            <NavItem
              key={value}
              to={`${workspaceOverviewPath(slug)}${workspaceSectionSearch(value)}`}
              label={label}
              Icon={SECTION_ICONS[value]}
              active={section === value}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </NavGroup>
      ) : null}
    </div>
  );
}

export function AppSidebar({ collapsed }: { collapsed: boolean }) {
  return (
    <aside
      id={APP_SIDEBAR_ID}
      aria-label="Workspace sidebar"
      data-collapsed={collapsed}
      className={cn(
        "hidden shrink-0 border-r border-border bg-card px-3 py-4 text-foreground transition-[width] duration-300 ease-in-out motion-reduce:transition-none md:block",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="sticky top-4">
        <SidebarContent collapsed={collapsed} />
      </div>
    </aside>
  );
}

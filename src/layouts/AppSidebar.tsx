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
import {
  ROUTES,
  workspaceOverviewPath,
  workspaceProjectsPath,
  workspaceEngagementsPath,
} from "@/lib/routes";
import type { WorkspaceNavigation } from "@/lib/workspaceNavigation";
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

const SECTION_ICONS: Partial<Record<WorkspaceSection, LucideIcon>> = {
  overview: LayoutDashboard,
  members: Users,
  roles: KeyRound,
  invitations: MailPlus,
  ownership: Crown,
  audit: ScrollText,
  "client-links": Users,
  "projects-recovery": Crown,
};

/** Shared by the desktop rail and the mobile Sheet. */
export function SidebarContent({
  collapsed = false,
  onNavigate,
  navigation,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
  navigation?: WorkspaceNavigation;
}) {
  const portfolio = useMatch(ROUTES.workspaces);
  const workspace = useMatch({ path: ROUTES.workspaceOverview, end: false });
  const projects = useMatch({ path: ROUTES.workspaceProjects, end: false });
  const engagements = useMatch({
    path: ROUTES.workspaceEngagements,
    end: false,
  });
  const overview = useMatch(ROUTES.workspaceOverview);
  const [params] = useSearchParams();
  const slug = workspace?.params.workspaceSlug;
  const section = readWorkspaceSection(params);
  return (
    <div className="flex shrink-0 flex-col gap-6 overflow-hidden">
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
        <>
          <NavGroup label="Workspace" collapsed={collapsed}>
            <NavItem
              to={workspaceOverviewPath(slug)}
              label="Overview"
              Icon={LayoutDashboard}
              active={Boolean(overview) && section === "overview"}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          </NavGroup>
          <NavGroup label="Delivery" collapsed={collapsed}>
            <NavItem
              to={workspaceProjectsPath(slug)}
              label="Projects"
              Icon={Layers}
              active={Boolean(projects)}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
            {navigation?.engagements ? (
              <NavItem
                to={workspaceEngagementsPath(slug)}
                label="Engagements"
                Icon={ScrollText}
                active={Boolean(engagements)}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ) : null}
          </NavGroup>
          <NavGroup label="Manage" collapsed={collapsed}>
            {WORKSPACE_SECTIONS.flatMap(({ value, label }) => {
              if (
                value === "overview" ||
                (value === "client-links" && !navigation?.clientLinks) ||
                (value === "projects-recovery" && !navigation?.projectRecovery)
              )
                return [];
              const Icon = SECTION_ICONS[value];
              return Icon ? (
                <NavItem
                  key={value}
                  to={`${workspaceOverviewPath(slug)}${workspaceSectionSearch(value)}`}
                  label={label}
                  Icon={Icon}
                  active={Boolean(overview) && section === value}
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                />
              ) : (
                []
              );
            })}
          </NavGroup>
        </>
      ) : null}
    </div>
  );
}

export function AppSidebar({
  collapsed,
  navigation,
}: {
  collapsed: boolean;
  navigation?: WorkspaceNavigation;
}) {
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
        <SidebarContent collapsed={collapsed} navigation={navigation} />
      </div>
    </aside>
  );
}

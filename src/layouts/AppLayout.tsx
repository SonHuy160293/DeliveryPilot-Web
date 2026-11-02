import { useLayoutEffect, type ReactNode } from "react";
import { Building2, Send } from "lucide-react";
import { Link, NavLink, Outlet } from "react-router";
import { Separator } from "@/components/ui/separator";
import { UserAccountMenu } from "@/components/UserAccountMenu";
import { ROUTES } from "@/lib/routes";
import { initializeTheme } from "@/lib/theme";

function WorkspaceNavigation() {
  return (
    <nav aria-label="Workspace navigation">
      <NavLink
        to={ROUTES.workspaces}
        end
        className={({ isActive }) =>
          `flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-150 ease-out ${isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`
        }
      >
        <Building2 aria-hidden="true" className="size-4 shrink-0" />
        <span>Workspaces</span>
      </NavLink>
    </nav>
  );
}

export function AppLayout({
  workspaceControl,
  breadcrumbs,
}: {
  workspaceControl?: ReactNode;
  breadcrumbs?: ReactNode;
  accountControl?: ReactNode;
  menuOpen?: boolean;
  onMenuOpenChange?: (open: boolean) => void;
}) {
  useLayoutEffect(initializeTheme, []);

  return (
    <div className="min-h-svh bg-background text-foreground">
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-background focus:p-3"
        href="#main-content"
      >
        Skip to content
      </a>
      <div className="flex min-h-svh">
        <aside
          aria-label="Workspace sidebar"
          className="hidden w-64 shrink-0 border-r border-border bg-muted px-4 py-6 text-foreground md:block"
        >
          <div className="flex flex-col gap-3">
            <Link
              to={ROUTES.workspaces}
              className="flex min-h-11 items-center gap-3 rounded-lg focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                aria-hidden="true"
                className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm"
              >
                <Send className="size-6" />
              </span>
              <span className="flex flex-col">
                <span className="text-xl font-bold tracking-tight">
                  <span className="text-foreground">Delivery</span>
                  <span className="text-primary">Pilot</span>
                </span>
                <span
                  aria-hidden="true"
                  className="text-xs font-semibold tracking-wider text-callout-foreground uppercase"
                >
                  Delivery platform
                </span>
              </span>
            </Link>
          </div>
          <Separator className="my-6" />
          <WorkspaceNavigation />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-border bg-background">
            <div className="flex min-h-16 items-center justify-between gap-3 px-4 md:px-6">
              <Link
                to={ROUTES.workspaces}
                className="flex min-w-0 items-center gap-3 text-lg font-bold tracking-tight md:hidden"
              >
                <span
                  aria-hidden="true"
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm"
                >
                  <Send className="size-4" />
                </span>
                <span>
                  <span className="text-foreground">Delivery</span>
                  <span className="text-primary">Pilot</span>
                </span>
              </Link>
              <div className="hidden min-w-0 md:block">
                {breadcrumbs ?? (
                  <span className="text-sm font-medium">Workspaces</span>
                )}
              </div>
              <div className="flex min-w-0 items-center gap-3">
                <div className="min-w-0">{workspaceControl}</div>
                <UserAccountMenu />
              </div>
            </div>
          </header>
          <main
            id="main-content"
            tabIndex={-1}
            className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6 md:py-8"
          >
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

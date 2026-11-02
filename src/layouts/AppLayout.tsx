import type { ReactNode } from "react";
import { NavLink, Outlet } from "react-router";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ROUTES } from "@/lib/routes";
import { SignOutButton } from "@/features/auth/components/SignOutButton";

function WorkspaceNavigation() {
  return (
    <nav aria-label="Workspace navigation" className="space-y-2">
      <NavLink
        to={ROUTES.workspaces}
        end
        className={({ isActive }) =>
          `flex min-h-11 items-center rounded-md px-3 text-sm font-medium ${
            isActive
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          }`
        }
      >
        Workspaces
      </NavLink>
      <p className="px-3 text-sm text-muted-foreground">
        Open a workspace to manage its members, roles, invitations, ownership,
        and audit history.
      </p>
    </nav>
  );
}

export function AppLayout({
  workspaceControl,
}: {
  workspaceControl?: ReactNode;
}) {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-background focus:p-3"
        href="#main-content"
      >
        Skip to content
      </a>
      <div className="flex min-h-svh">
        <aside className="hidden w-64 shrink-0 border-r border-border bg-card px-4 py-6 md:block">
          <p className="mb-6 text-lg font-bold">DeliveryPilot</p>
          <p className="mb-3 text-xs font-semibold text-muted-foreground">
            Workspace navigation
          </p>
          <WorkspaceNavigation />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-border bg-background">
            <div className="flex min-h-16 items-center justify-between gap-2 px-4 md:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="min-h-11 md:hidden"
                    >
                      Menu
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-64">
                    <SheetHeader>
                      <SheetTitle>DeliveryPilot navigation</SheetTitle>
                      <SheetDescription>
                        Choose a workspace navigation item.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="space-y-4 px-4 py-4">
                      <SheetClose asChild>
                        <NavLink
                          to={ROUTES.workspaces}
                          className="flex min-h-11 items-center rounded-md px-3 text-sm font-medium hover:bg-accent"
                        >
                          Workspaces
                        </NavLink>
                      </SheetClose>
                    </div>
                  </SheetContent>
                </Sheet>
                {workspaceControl ?? <span>Workspaces</span>}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <ThemeToggle />
                <SignOutButton />
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

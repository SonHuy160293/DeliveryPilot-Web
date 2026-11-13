import { useLayoutEffect, useState, type ReactNode } from "react";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Link, Outlet } from "react-router";
import { UserAccountMenu } from "@/components/UserAccountMenu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  APP_SIDEBAR_ID,
  AppSidebar,
  SidebarContent,
} from "@/layouts/AppSidebar";
import { BrandMark, BrandWord } from "@/layouts/Brand";
import { ROUTES } from "@/lib/routes";
import { initializeTheme } from "@/lib/theme";
import type { WorkspaceNavigation } from "@/lib/workspaceNavigation";

function MobileNavigation({
  navigation,
}: {
  navigation?: WorkspaceNavigation;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Open navigation"
          className="size-10 shrink-0 md:hidden"
        >
          <Menu aria-hidden="true" className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 gap-0 p-4">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription>
            Move between workspaces and sections.
          </SheetDescription>
        </SheetHeader>
        <SidebarContent
          navigation={navigation}
          onNavigate={() => {
            setOpen(false);
          }}
        />
      </SheetContent>
    </Sheet>
  );
}

export function AppLayout({
  workspaceControl,
  breadcrumbs,
  navigation,
  content,
}: {
  workspaceControl?: ReactNode;
  breadcrumbs?: ReactNode;
  navigation?: WorkspaceNavigation;
  content?: ReactNode;
}) {
  useLayoutEffect(initializeTheme, []);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const SidebarIcon = sidebarCollapsed ? PanelLeftOpen : PanelLeftClose;
  const toggleLabel = sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar";

  return (
    <div className="min-h-svh bg-background text-foreground">
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-background focus:p-3"
        href="#main-content"
      >
        Skip to content
      </a>
      <div className="flex min-h-svh">
        <AppSidebar collapsed={sidebarCollapsed} navigation={navigation} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-border bg-card">
            <div className="flex min-h-16 items-center justify-between gap-3 px-4 md:px-8">
              <div className="flex min-w-0 items-center gap-2 md:hidden">
                <MobileNavigation navigation={navigation} />
                <Link
                  to={ROUTES.workspaces}
                  className="flex min-w-0 items-center gap-3 text-lg"
                >
                  <BrandMark compact />
                  <span className="hidden sm:inline">
                    <BrandWord />
                  </span>
                </Link>
              </div>
              <div className="hidden min-w-0 items-center gap-3 md:flex">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-controls={APP_SIDEBAR_ID}
                  aria-expanded={!sidebarCollapsed}
                  aria-label={toggleLabel}
                  title={toggleLabel}
                  className="size-10 shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setSidebarCollapsed((prev) => !prev);
                  }}
                >
                  <SidebarIcon aria-hidden="true" className="size-5" />
                </Button>
                <div className="min-w-0 text-sm font-medium">
                  {breadcrumbs ?? <span>Workspaces</span>}
                </div>
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
            className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-8 md:py-12"
          >
            {content ?? <Outlet />}
          </main>
        </div>
      </div>
    </div>
  );
}

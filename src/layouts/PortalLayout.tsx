import { useState } from "react";
import { Menu, Layers } from "lucide-react";
import { Link, Outlet } from "react-router";
import { ThemeToggle } from "@/components/ThemeToggle";
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
import { BrandMark, BrandWord } from "@/layouts/Brand";
import { NavGroup, NavItem } from "@/layouts/SidebarNav";
import { ROUTES } from "@/lib/routes";

function PortalNavigation({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <NavGroup label="Client portal" collapsed={false}>
      <NavItem
        to={ROUTES.portal}
        label="My projects"
        Icon={Layers}
        active
        collapsed={false}
        onNavigate={onNavigate}
      />
    </NavGroup>
  );
}

export function PortalLayout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-svh bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-background focus:p-3"
      >
        Skip to content
      </a>
      <div className="flex min-h-svh">
        <aside
          aria-label="Client portal sidebar"
          className="hidden w-64 shrink-0 border-r border-border bg-card px-3 py-4 md:block"
        >
          <div className="sticky top-4 flex flex-col gap-6">
            <Link
              to={ROUTES.portal}
              aria-label="DeliveryPilot · Client portal"
              className="flex min-h-12 items-center gap-3 rounded-lg focus-visible:ring-2 focus-visible:ring-ring"
            >
              <BrandMark />
              <span className="text-lg">
                <BrandWord />
              </span>
            </Link>
            <PortalNavigation />
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-border bg-card">
            <div className="flex min-h-16 items-center justify-between gap-2 px-4 md:px-8">
              <div className="flex min-w-0 items-center gap-2">
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
                  <SheetContent side="left" className="w-72 gap-6 p-4">
                    <SheetHeader>
                      <SheetTitle>Client portal</SheetTitle>
                      <SheetDescription>
                        Move between your client projects.
                      </SheetDescription>
                    </SheetHeader>
                    <PortalNavigation
                      onNavigate={() => {
                        setOpen(false);
                      }}
                    />
                  </SheetContent>
                </Sheet>
                <Link
                  to={ROUTES.portal}
                  className="min-w-0 text-sm font-medium"
                >
                  Client portal
                </Link>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <ThemeToggle />
                <UserAccountMenu />
              </div>
            </div>
          </header>
          <main
            id="main-content"
            tabIndex={-1}
            className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-8 md:py-12"
          >
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

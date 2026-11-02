import { Link, Outlet, useLocation } from "react-router";
import { usePagePreviewState } from "@/components/PageStateGate";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import { MarketingHeader } from "@/layouts/MarketingHeader";
import { MarketingFooter } from "@/layouts/MarketingFooter";

export function PublicLayout() {
  const { pathname } = useLocation();
  const state = usePagePreviewState();
  const marketing = pathname === ROUTES.home && state === "ready";
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-background focus:p-3"
        href="#main-content"
      >
        Skip to content
      </a>
      {marketing ? (
        <MarketingHeader />
      ) : (
        <header className="sticky top-0 z-20 border-b border-border bg-background">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-3 md:px-6">
            <Link
              to={ROUTES.home}
              className="text-base font-bold tracking-tight"
            >
              DeliveryPilot
            </Link>
            <nav
              aria-label="Public navigation"
              className="flex items-center gap-2"
            >
              <Button asChild variant="ghost" size="sm" className="min-h-11">
                <Link to={ROUTES.signIn}>Sign in</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="hidden min-h-11 sm:inline-flex"
              >
                <Link to={ROUTES.signUp}>Get started</Link>
              </Button>
            </nav>
          </div>
        </header>
      )}
      <main id="main-content" tabIndex={-1} className="min-w-0 flex-1">
        <Outlet />
      </main>
      {marketing ? (
        <MarketingFooter />
      ) : (
        <footer className="border-t border-border">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:justify-between md:px-6">
            <span>DeliveryPilot</span>
            <span>Make delivery decisions with evidence.</span>
          </div>
        </footer>
      )}
    </div>
  );
}

import { Link } from "react-router";
import { ROUTES } from "@/lib/routes";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex flex-col gap-2">
          <p className="text-lg font-bold tracking-tight">DeliveryPilot</p>
          <p className="text-sm text-muted-foreground">
            Delivery commitments, with their context.
          </p>
        </div>
        <nav aria-label="Footer navigation" className="flex flex-wrap gap-6">
          <Link
            to={ROUTES.workspaces}
            className="inline-flex min-h-11 items-center text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Explore the preview
          </Link>
          <Link
            to={ROUTES.signIn}
            className="inline-flex min-h-11 items-center text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Sign in
          </Link>
        </nav>
      </div>
    </footer>
  );
}

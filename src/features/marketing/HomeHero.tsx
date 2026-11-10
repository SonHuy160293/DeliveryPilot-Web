import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeliveryRecord } from "@/features/marketing/DeliveryRecord";
import { ROUTES } from "@/lib/routes";

export function HomeHero() {
  return (
    <section aria-labelledby="hero-title" className="border-b border-border">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-12 md:grid-cols-2 md:gap-8 md:px-6 md:py-16 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col items-start gap-6 lg:col-span-5">
          <h1
            id="hero-title"
            className="text-4xl font-bold leading-tight tracking-tight text-balance"
          >
            Know what’s committed.
            <br />
            <span className="text-brand-strong">Trace the evidence.</span>
          </h1>
          <p className="max-w-md text-lg leading-relaxed text-muted-foreground">
            Software delivery management for engineering and delivery leaders.
            Designed to connect agreed scope, delivery work and the evidence
            behind the next decision.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="h-auto max-w-full whitespace-normal">
              <Link to={ROUTES.signUp}>
                Get started{" "}
                <ArrowRight aria-hidden="true" data-icon="inline-end" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-auto max-w-full whitespace-normal"
            >
              <Link to={ROUTES.workspaces}>Open the app</Link>
            </Button>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Early access. Accounts and workspaces are available today; the
            delivery workflows illustrated on this page are in development.
          </p>
        </div>
        <div className="min-w-0 lg:col-span-7">
          <DeliveryRecord />
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 pb-8 md:flex-row md:items-center md:justify-between md:px-6">
        <p className="text-sm font-medium">
          Built around the decisions behind delivery.
        </p>
        <p className="text-sm text-muted-foreground">
          Agreed scope. Connected work. Reviewable evidence.
        </p>
      </div>
    </section>
  );
}

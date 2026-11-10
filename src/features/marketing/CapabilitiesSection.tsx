import { FileCheck2, GitBranch, Unplug, Waypoints } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export function CapabilitiesSection() {
  return (
    <section
      id="capabilities"
      tabIndex={-1}
      aria-labelledby="capabilities-title"
      className="scroll-mt-16"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-12 md:px-6 md:py-16">
        <div className="grid gap-6 md:grid-cols-2">
          <h2
            id="capabilities-title"
            className="max-w-md text-3xl font-semibold leading-tight tracking-tight text-balance"
          >
            Less reconstruction.
            <br />
            More delivery context.
          </h2>
          <p className="max-w-lg text-base leading-relaxed text-muted-foreground">
            A product direction built around four connections that matter when
            you’re accountable for delivery.
          </p>
        </div>
        <article className="grid gap-8 rounded-xl bg-accent p-6 text-foreground md:grid-cols-2 md:p-8">
          <div className="flex flex-col items-start gap-4">
            <FileCheck2
              aria-hidden="true"
              className="size-6 text-brand-strong"
            />
            <h3 className="max-w-sm text-2xl font-semibold leading-tight tracking-tight text-brand-strong">
              Keep the agreed version in view.
            </h3>
            <p className="text-base leading-relaxed">
              Connect requirement versions and approval decisions to the scope
              they define. Preserve the baseline when a change is proposed.
            </p>
          </div>
          <div className="flex flex-col justify-center gap-4">
            <p className="text-sm font-semibold">
              Illustrative requirement · REQ-024
            </p>
            <Separator className="bg-accent-foreground" />
            <dl className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <dt className="text-sm font-medium">Approved baseline</dt>
                <dd className="flex flex-wrap items-center gap-3">
                  <Badge
                    variant="outline"
                    className="max-w-full whitespace-normal"
                  >
                    Version 2
                  </Badge>
                  <span className="text-sm">Invite a client collaborator</span>
                </dd>
              </div>
              <div className="ml-3 flex flex-col gap-2 border-l border-dashed border-accent-foreground py-2 pl-4">
                <dt className="text-sm font-medium">Proposed revision</dt>
                <dd className="flex flex-col items-start gap-2">
                  <Badge
                    variant="outline"
                    className="max-w-full whitespace-normal"
                  >
                    Version 3 · Proposed
                  </Badge>
                  <p className="text-sm">Add an invitation expiry reminder.</p>
                  <p className="text-sm font-medium">
                    Version 2 remains the baseline.
                  </p>
                </dd>
              </div>
            </dl>
          </div>
        </article>
        <div className="grid gap-8 md:grid-cols-2">
          <article className="flex flex-col items-start gap-4 border-t border-border pt-6">
            <GitBranch
              aria-hidden="true"
              className="size-6 text-brand-strong"
            />
            <h3 className="text-xl font-semibold tracking-tight">
              Give delivery work its context.
            </h3>
            <p className="text-base leading-relaxed text-muted-foreground">
              Connect goals and requirements to features, stories and
              implementation work, so an activity can be understood alongside
              the commitment it supports.
            </p>
            <p className="text-sm font-medium">
              Business intent / Requirement / Delivery work
            </p>
          </article>
          <article className="flex flex-col items-start gap-4 border-t border-border pt-6">
            <Unplug aria-hidden="true" className="size-6 text-brand-strong" />
            <h3 className="text-xl font-semibold tracking-tight">
              Make the obstacle explicit.
            </h3>
            <p className="text-base leading-relaxed text-muted-foreground">
              Keep a blocker and its context visible where people can act.
              Distinguish an active obstruction from a potential risk or a
              dependency.
            </p>
            <p className="text-sm font-medium">
              Example blocker: waiting for test environment access
            </p>
          </article>
        </div>
        <article className="grid gap-6 border-t border-border pt-8 md:grid-cols-2">
          <div className="flex flex-col items-start gap-4">
            <Waypoints
              aria-hidden="true"
              className="size-6 text-brand-strong"
            />
            <h3 className="text-xl font-semibold tracking-tight">
              Ask what the evidence shows.
            </h3>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground">
              A finished story is not a passed test, a client acceptance or a
              release. Keep each outcome visible and independently reviewable.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-4">
            {["Work", "QA verification", "Client acceptance", "Release"].map(
              (label) => (
                <div
                  key={label}
                  className="flex flex-col gap-2 rounded-md bg-muted p-4"
                >
                  <dt className="text-sm font-medium">{label}</dt>
                  <dd className="text-sm text-muted-foreground">
                    A distinct outcome
                  </dd>
                </div>
              ),
            )}
          </dl>
        </article>
      </div>
    </section>
  );
}

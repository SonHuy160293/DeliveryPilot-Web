import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";

const responsibilities = [
  {
    role: "Delivery Managers",
    title: "Explain the commitment, not just the activity.",
    description:
      "Keep scope, stakeholder decisions and delivery obstacles in context across the projects you coordinate.",
  },
  {
    role: "Engineering Managers",
    title: "Connect implementation to the outcome.",
    description:
      "Understand what work supports, what is blocked and what still needs verification or review.",
  },
  {
    role: "Project teams and stakeholders",
    title: "Review the same context, within the right boundaries.",
    description:
      "Support internal collaboration and intentionally shared client reviews. Access must always follow explicit authorization.",
  },
] as const;

export function AudienceSection() {
  return (
    <>
      <section
        id="for-teams"
        tabIndex={-1}
        aria-labelledby="audience-title"
        className="scroll-mt-16"
      >
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-12 md:grid-cols-2 md:gap-8 md:px-6 md:py-16">
          <div className="flex flex-col items-start gap-6">
            <h2
              id="audience-title"
              className="max-w-md text-3xl font-semibold leading-tight tracking-tight text-balance"
            >
              For the people accountable for delivery.
            </h2>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground">
              Designed for software agencies, outsourcing teams and engineering
              organizations balancing project commitments with the reality of
              delivery.
            </p>
            <Button
              asChild
              variant="link"
              className="h-auto max-w-full whitespace-normal px-0"
            >
              <Link to={ROUTES.workspaces}>
                Explore the workspace preview{" "}
                <ArrowRight aria-hidden="true" data-icon="inline-end" />
              </Link>
            </Button>
          </div>
          <dl className="flex flex-col gap-8">
            {responsibilities.map((item) => (
              <div
                key={item.role}
                className="flex flex-col gap-3 border-t border-border pt-4"
              >
                <dt className="text-sm font-medium text-primary">
                  {item.role}
                </dt>
                <dd className="flex flex-col gap-2">
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-base leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
      <section
        aria-labelledby="closing-title"
        className="px-4 pb-12 md:px-6 md:pb-16"
      >
        <div className="mx-auto grid max-w-6xl gap-8 rounded-xl bg-accent px-6 py-12 text-accent-foreground md:grid-cols-2 md:items-center md:px-8">
          <div className="flex flex-col gap-4">
            <h2
              id="closing-title"
              className="text-3xl font-semibold leading-tight tracking-tight text-balance"
            >
              Make the next delivery decision with context.
            </h2>
            <p className="text-base leading-relaxed">
              Start with the DeliveryPilot interface preview. See the foundation
              for a more connected delivery record.
            </p>
          </div>
          <div className="flex flex-col items-start gap-4 md:items-end">
            <Button asChild className="h-auto max-w-full whitespace-normal">
              <Link to={ROUTES.signUp}>
                Get started{" "}
                <ArrowRight aria-hidden="true" data-icon="inline-end" />
              </Link>
            </Button>
            <p className="max-w-xs text-sm leading-relaxed md:text-right">
              Registration is a UI preview. No account or workspace is created.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

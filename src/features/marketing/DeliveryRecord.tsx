import { FileText, GitBranch, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const outcomes = [
  { label: "QA verification", value: "Evidence pending" },
  { label: "Client acceptance", value: "Review pending" },
  { label: "Release", value: "Not released" },
] as const;

export function DeliveryRecord() {
  return (
    <figure
      aria-labelledby="delivery-record-caption"
      className="flex min-w-0 flex-col gap-3"
    >
      <Card className="relative overflow-hidden shadow-md">
        <CardHeader className="border-b pb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>
              <h2 className="text-base">A connected delivery record</h2>
            </CardTitle>
            <Badge className="max-w-full whitespace-normal" variant="secondary">
              Example
            </Badge>
          </div>
          <CardDescription>
            Client onboarding · Illustrative project
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-0 px-4 sm:px-6">
          <div className="flex gap-3">
            <div
              aria-hidden="true"
              className="flex shrink-0 flex-col items-center"
            >
              <span className="flex size-6 items-center sm:size-8 justify-center rounded-md bg-accent text-accent-foreground">
                <FileText className="size-3 sm:size-4" />
              </span>
              <span className="min-h-6 w-px flex-1 bg-border" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-3 pb-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Requirement · REQ-024
                </p>
                <Badge
                  className="max-w-full whitespace-normal"
                  variant="outline"
                >
                  Version 2
                </Badge>
              </div>
              <h3 className="text-xl font-semibold tracking-tight">
                Invite a client collaborator
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Agreed scope and the version behind the commitment.
              </p>
              <p className="flex items-center gap-2 text-sm font-medium text-primary">
                <Link2 aria-hidden="true" className="size-4 shrink-0" /> Linked
                to delivery work
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div
              aria-hidden="true"
              className="flex shrink-0 flex-col items-center"
            >
              <span className="flex size-6 items-center sm:size-8 justify-center rounded-md bg-accent text-accent-foreground">
                <GitBranch className="size-3 sm:size-4" />
              </span>
              <span className="min-h-6 w-px flex-1 bg-border" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-3 pb-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Delivery work · STORY-018
                </p>
                <Badge
                  className="max-w-full whitespace-normal"
                  variant="secondary"
                >
                  Work done
                </Badge>
              </div>
              <h3 className="text-lg font-semibold">
                Build the invitation flow
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Implementation complete is one part of the delivery story.
              </p>
            </div>
          </div>
          <Separator />
          <dl className="divide-y divide-border">
            {outcomes.map((outcome) => (
              <div
                key={outcome.label}
                className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
              >
                <dt className="text-muted-foreground">{outcome.label}</dt>
                <dd className="font-medium">{outcome.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
      <figcaption
        id="delivery-record-caption"
        className="px-2 text-sm leading-relaxed text-muted-foreground"
      >
        Concept illustration, not live product data. Work, verification,
        acceptance and release remain separate.
      </figcaption>
    </figure>
  );
}

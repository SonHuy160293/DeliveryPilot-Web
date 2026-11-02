import { FileText, MessageSquare, Layers, Search } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const fragments = [
  {
    icon: FileText,
    title: "Requirements in a document",
    question: "Which version was agreed?",
  },
  {
    icon: MessageSquare,
    title: "Decisions in a conversation",
    question: "What changed, and why?",
  },
  {
    icon: Layers,
    title: "Work on a separate board",
    question: "What commitment does it support?",
  },
  {
    icon: Search,
    title: "Evidence across tools",
    question: "What is actually ready for review?",
  },
] as const;

export function ProblemSection() {
  return (
    <section
      id="approach"
      tabIndex={-1}
      aria-labelledby="approach-title"
      className="scroll-mt-16 bg-muted"
    >
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-2 md:px-6 md:py-16">
        <div className="flex flex-col gap-6">
          <h2
            id="approach-title"
            className="max-w-md text-3xl font-semibold leading-tight tracking-tight text-balance"
          >
            The work moved forward.
            <br />
            The context didn’t.
          </h2>
          <p className="max-w-md text-base leading-relaxed text-muted-foreground">
            When scope, decisions and evidence live apart, a simple delivery
            question becomes a search through documents, messages and boards.
          </p>
          <ul className="flex flex-col gap-4">
            {fragments.map(({ icon: Icon, title, question }) => (
              <li key={title} className="flex items-start gap-3">
                <Icon
                  aria-hidden="true"
                  className="mt-1 size-4 shrink-0 text-muted-foreground"
                />
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-sm text-muted-foreground">{question}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col justify-between gap-8 rounded-xl bg-primary p-6 text-primary-foreground md:p-8">
          <h3 className="max-w-sm text-2xl font-semibold leading-tight tracking-tight">
            Keep the context attached to the commitment.
          </h3>
          <div className="flex flex-col gap-6">
            <p className="text-base leading-relaxed">
              DeliveryPilot is designed to connect the agreed requirement, the
              work it shapes and the evidence people need to review it.
            </p>
            <Separator className="bg-primary-foreground" />
            <p className="text-lg font-medium">
              One question. A connected record.
            </p>
          </div>
          <p className="text-sm leading-relaxed">
            The intended approach, illustrated here. Connected delivery
            workflows are still to come.
          </p>
        </div>
      </div>
    </section>
  );
}

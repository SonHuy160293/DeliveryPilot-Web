const steps = [
  {
    number: "01",
    title: "Define the commitment",
    description:
      "Capture the problem, scope and requirement version. Make the approval context explicit.",
  },
  {
    number: "02",
    title: "Connect the delivery work",
    description:
      "Link the commitment to execution, decisions, blockers and supporting context.",
  },
  {
    number: "03",
    title: "Review the evidence",
    description:
      "Understand what is done, what was verified and which human decision comes next.",
  },
] as const;

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      tabIndex={-1}
      aria-labelledby="workflow-title"
      className="scroll-mt-16 bg-primary text-primary-foreground"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-12 md:px-6 md:py-16">
        <div className="grid gap-6 md:grid-cols-2">
          <h2
            id="workflow-title"
            className="max-w-md text-3xl font-semibold leading-tight tracking-tight text-balance"
          >
            From business intent
            <br />
            to a reviewable outcome.
          </h2>
          <p className="max-w-lg text-base leading-relaxed">
            The intended journey keeps the why, the work and the evidence
            connected. Teams can refine, deliver and review iteratively.
          </p>
        </div>
        <div className="relative">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-6 left-6 top-6 w-px bg-primary-foreground xl:hidden"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-6 hidden h-px bg-primary-foreground xl:block"
          />
          <ol className="flex flex-col gap-8 xl:grid xl:grid-cols-3">
            {steps.map((step) => (
              <li
                key={step.number}
                className="relative flex flex-col gap-4 pl-16 xl:pl-0"
              >
                <span
                  className="absolute left-0 top-0 flex size-12 items-center justify-center rounded-full border border-primary-foreground bg-primary text-xl font-semibold tabular-nums xl:static"
                  aria-hidden="true"
                >
                  {step.number}
                </span>
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="text-base leading-relaxed">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

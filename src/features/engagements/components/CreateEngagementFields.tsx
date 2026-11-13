import type { UseFormReturn } from "react-hook-form";
import { FormField } from "@/components/FormField";
import { formatCount } from "@/lib/format";
import type {
  CreateFormValues,
  CreateFormRequest,
} from "@/features/engagements/model/createForm";

const fields = [
  {
    name: "clientDisplayName",
    id: "eng-client-display-name",
    label: "Client display name",
    type: "text",
    required: true,
    count: 200,
  },
  {
    name: "agreementReference",
    id: "eng-agreement-reference",
    label: "Agreement reference",
    type: "text",
    required: true,
    count: 0,
  },
  {
    name: "agreementSignedOn",
    id: "eng-agreement-signed-on",
    label: "Agreement signed on",
    type: "date",
    required: true,
    count: 0,
  },
  {
    name: "engagementName",
    id: "eng-name",
    label: "Engagement name (optional)",
    type: "text",
    required: false,
    count: 200,
  },
  {
    name: "clientLegalName",
    id: "eng-client-legal-name",
    label: "Client legal name (optional)",
    type: "text",
    required: false,
    count: 200,
  },
  {
    name: "clientCountryCode",
    id: "eng-client-country",
    label: "Client country (optional)",
    type: "text",
    required: false,
    count: 0,
  },
  {
    name: "documentUrl",
    id: "eng-document-url",
    label: "Agreement document link (optional)",
    type: "url",
    required: false,
    count: 2000,
  },
] as const;
export function CreateEngagementFields({
  form,
  locked,
}: {
  form: UseFormReturn<CreateFormValues, unknown, CreateFormRequest>;
  locked: boolean;
}) {
  return (
    <>
      {locked ? (
        <p role="note" className="text-sm">
          Retry uses the original engagement details.
        </p>
      ) : null}
      {fields.map((field) => {
        const error = form.formState.errors[field.name]?.message;
        return (
          <div key={field.id} className="flex min-w-0 flex-col gap-1">
            <FormField
              id={field.id}
              label={field.label}
              type={field.type}
              required={field.required}
              readOnly={locked}
              error={error}
              {...form.register(field.name)}
              aria-describedby={
                [
                  field.count ? `${field.id}-count` : "",
                  error ? `${field.id}-error` : "",
                ]
                  .filter(Boolean)
                  .join(" ") || undefined
              }
            />
            {field.count ? (
              <p
                id={`${field.id}-count`}
                className="text-xs text-muted-foreground"
              >
                {formatCount(form.watch(field.name).length)} /{" "}
                {formatCount(field.count)}
              </p>
            ) : null}
          </div>
        );
      })}
    </>
  );
}

import { Fragment, type ReactNode } from "react";

export interface DefinitionListItem {
  id: string;
  label: string;
  value: ReactNode;
}
export function DefinitionList({
  items,
}: {
  items: readonly DefinitionListItem[];
}) {
  return (
    <dl className="grid gap-x-6 gap-y-3 md:grid-cols-3">
      {items.map(({ id, label, value }) => (
        <Fragment key={id}>
          <dt className="min-w-0 break-words text-sm text-muted-foreground">
            {label}
          </dt>
          <dd className="min-w-0 break-words md:col-span-2">
            {value === null || value === undefined || value === ""
              ? "Not recorded"
              : value}
          </dd>
        </Fragment>
      ))}
    </dl>
  );
}

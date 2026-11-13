import { CheckCircle2, Circle } from "lucide-react";
import type { ReactNode } from "react";

export interface ReadinessChecklistItem {
  id: string;
  label: string;
  done: boolean;
  hint?: string;
  action?: ReactNode;
  missingLabel?: string;
}

export function ReadinessChecklist({
  items,
}: {
  items: readonly ReadinessChecklistItem[];
}) {
  return (
    <ul className="flex min-w-0 flex-col gap-4">
      {items.map(({ id, label, done, hint, action, missingLabel }) => {
        const Icon = done ? CheckCircle2 : Circle;
        return (
          <li key={id} className="flex min-w-0 items-start gap-3">
            <Icon
              aria-hidden="true"
              className="size-6 shrink-0 text-muted-foreground"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="break-words font-medium">{label}</span>
              {hint ? (
                <p className="break-words text-sm text-muted-foreground">
                  {hint}
                </p>
              ) : null}
              {action}
            </div>
            <span className="shrink-0 text-sm">
              {done ? "Done" : (missingLabel ?? "Missing")}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

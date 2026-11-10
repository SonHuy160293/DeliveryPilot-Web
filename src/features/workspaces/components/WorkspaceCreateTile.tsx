import type { MouseEventHandler } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PortfolioView } from "@/features/workspaces/model/portfolio";
import { cn } from "@/lib/utils";

export function WorkspaceCreateTile({
  onCreate,
  view = "grid",
}: {
  onCreate: MouseEventHandler<HTMLButtonElement>;
  view?: PortfolioView;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        "h-full min-h-40 flex-col gap-3 rounded-xl border-dashed border-brand/50 bg-transparent p-6 whitespace-normal shadow-none hover:border-brand hover:bg-callout hover:text-foreground",
        view === "list" && "md:min-h-24 md:flex-row md:gap-4",
      )}
      onClick={onCreate}
    >
      <span
        aria-hidden="true"
        className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground"
      >
        <Plus className="size-6" />
      </span>
      <span className="flex flex-col gap-1">
        <span className="text-sm font-bold">Add another workspace</span>
        <span className="text-sm font-normal text-muted-foreground">
          Give your next team its own space.
        </span>
      </span>
    </Button>
  );
}

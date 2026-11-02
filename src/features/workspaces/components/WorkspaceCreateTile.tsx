import type { MouseEventHandler } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function WorkspaceCreateTile({
  onCreate,
}: {
  onCreate: MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <Card className="hidden border-dashed md:flex">
      <CardContent className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <Plus aria-hidden="true" className="size-8 text-primary" />
        <h3 className="text-lg font-semibold">Bring another team on board</h3>
        <p className="text-sm text-muted-foreground">
          Create a dedicated workspace for your team.
        </p>
        <Button type="button" variant="outline" onClick={onCreate}>
          Create another workspace
        </Button>
      </CardContent>
    </Card>
  );
}

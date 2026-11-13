import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
export function ProjectLoading({ header = false }: { header?: boolean }) {
  return (
    <div role="status" aria-busy="true" className="flex min-w-0 flex-col gap-6">
      <span className="sr-only">Loading project overview.</span>
      {header ? <Skeleton className="h-8 w-48" /> : null}
      <div className="grid min-w-0 gap-6 md:grid-cols-2">
        {Array.from({ length: 6 }, (_, index) => (
          <Card key={index}>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

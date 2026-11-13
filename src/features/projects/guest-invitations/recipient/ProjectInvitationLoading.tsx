import { Skeleton } from "@/components/ui/skeleton";
export function ProjectInvitationLoading() {
  return (
    <div
      role="status"
      aria-label="Checking your invitation"
      aria-busy="true"
      className="flex flex-col gap-4"
    >
      <span>Checking your invitation</span>
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

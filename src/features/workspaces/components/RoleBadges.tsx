import { Badge } from "@/components/ui/badge";
import type { Member } from "@/features/workspaces/api/contracts";

export function RoleBadges({ roles }: { roles: Member["roles"] }) {
  return (
    <span className="flex flex-wrap gap-2">
      {roles.map((role) => (
        <Badge
          key={role.id}
          variant="secondary"
          className="max-w-full whitespace-normal break-words"
        >
          {role.name}
        </Badge>
      ))}
    </span>
  );
}

import { Badge } from "@/components/ui/badge";
import type { StatusTone } from "@/lib/statusTone";
import { cn } from "@/lib/utils";

const variants = {
  neutral: "secondary",
  active: "default",
  attention: "outline",
  ended: "ghost",
} as const;

export function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: StatusTone;
}) {
  return (
    <Badge
      variant={variants[tone]}
      className={cn(
        "max-w-full whitespace-normal break-words",
        tone === "attention" && "text-accent-foreground",
        tone === "ended" && "text-muted-foreground",
      )}
    >
      {label}
    </Badge>
  );
}

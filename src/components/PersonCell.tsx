import { cn } from "@/lib/utils";

const avatarClasses = [
  "bg-avatar-1 text-avatar-1-foreground",
  "bg-avatar-2 text-avatar-2-foreground",
  "bg-avatar-3 text-avatar-3-foreground",
  "bg-avatar-4 text-avatar-4-foreground",
  "bg-avatar-5 text-avatar-5-foreground",
  "bg-avatar-6 text-avatar-6-foreground",
] as const;
export interface PersonCellProps {
  userId: string;
  displayName: string | null;
  secondary?: string;
}

export function PersonCell({
  userId,
  displayName,
  secondary,
}: PersonCellProps) {
  const name = displayName?.trim() || "Name unavailable";
  const initials =
    displayName
      ?.trim()
      .split(/\s+/u)
      .slice(0, 2)
      .map((part) => Array.from(part)[0] ?? "")
      .join("")
      .toLocaleUpperCase() || "";
  const hash = Array.from(userId).reduce(
    (value, char) => (value * 31 + (char.codePointAt(0) ?? 0)) % 6,
    0,
  );
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        aria-hidden="true"
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
          avatarClasses[hash],
        )}
      >
        {initials}
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <span
          className={cn(
            "break-words",
            !displayName?.trim() && "text-muted-foreground",
          )}
        >
          {name}
        </span>
        {secondary ? (
          <span className="break-all text-sm text-muted-foreground">
            {secondary}
          </span>
        ) : null}
      </div>
    </div>
  );
}

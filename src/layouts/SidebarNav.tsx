import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router";
import { cn } from "@/lib/utils";
import { revealClass } from "@/layouts/revealClass";

export function NavItem({
  to,
  label,
  Icon,
  active,
  collapsed,
  onNavigate,
}: {
  to: string;
  label: string;
  Icon: LucideIcon;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      to={to}
      title={collapsed ? label : undefined}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        "relative flex min-h-10 items-center gap-2 overflow-hidden rounded-xl text-sm transition-colors duration-150 ease-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        active
          ? "bg-primary font-bold text-primary-foreground"
          : "font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground",
      )}
    >
      {active ? (
        <span
          aria-hidden="true"
          className="absolute left-0 h-4 w-1 rounded-full bg-brand"
        />
      ) : null}
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center"
      >
        <Icon className="size-5" />
      </span>
      <span className={revealClass(collapsed)}>{label}</span>
    </Link>
  );
}

export function NavGroup({
  label,
  collapsed,
  children,
}: {
  label: string;
  collapsed: boolean;
  children: ReactNode;
}) {
  return (
    <nav aria-label={label} className="flex flex-col gap-2">
      <p
        aria-hidden="true"
        className={cn(
          "px-3 text-xs font-bold tracking-widest text-muted-foreground uppercase",
          revealClass(collapsed),
        )}
      >
        {label}
      </p>
      <div className="flex flex-col gap-1">{children}</div>
    </nav>
  );
}

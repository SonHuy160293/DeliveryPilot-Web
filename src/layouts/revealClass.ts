import { cn } from "@/lib/utils";

/** Fades sidebar labels so they never pop in while the rail width animates. */
export function revealClass(collapsed: boolean) {
  return cn(
    "min-w-0 whitespace-nowrap transition-opacity ease-out motion-reduce:transition-none",
    collapsed ? "opacity-0 duration-100" : "opacity-100 delay-100 duration-200",
  );
}

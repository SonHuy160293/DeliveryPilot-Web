export const homeSections = [
  { id: "approach", label: "The approach" },
  { id: "capabilities", label: "Capabilities" },
  { id: "how-it-works", label: "How it works" },
  { id: "for-teams", label: "For teams" },
] as const;

export function homeSectionHref(id: string): string {
  return `#${id}`;
}

/** In-page project tabs on the approved project detail route. */
export const PROJECT_TAB_PARAM = "tab";

export const PROJECT_TABS = [
  { value: "overview", label: "Overview" },
  { value: "team", label: "Team" },
  { value: "stakeholders", label: "Stakeholders" },
  { value: "settings", label: "Settings" },
  { value: "sharing", label: "Sharing" },
] as const;

export type ProjectTab = (typeof PROJECT_TABS)[number]["value"];

export function readProjectTab(params: URLSearchParams): ProjectTab {
  const value = params.get(PROJECT_TAB_PARAM);
  return PROJECT_TABS.find((tab) => tab.value === value)?.value ?? "overview";
}

export function projectTabSearch(tab: ProjectTab): string {
  return tab === "overview"
    ? ""
    : `?${new URLSearchParams({ [PROJECT_TAB_PARAM]: tab }).toString()}`;
}

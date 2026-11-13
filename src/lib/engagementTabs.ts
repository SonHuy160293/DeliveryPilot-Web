/** In-page engagement tabs on the approved engagement detail route. */
export const ENGAGEMENT_TAB_PARAM = "tab";

export const ENGAGEMENT_TABS = [
  { value: "details", label: "Details" },
  { value: "contract", label: "Contract" },
  { value: "milestones", label: "Milestones" },
  { value: "contacts", label: "Contacts" },
  { value: "projects", label: "Projects" },
  { value: "client-link", label: "Client link" },
  { value: "history", label: "History" },
] as const;

export type EngagementTab = (typeof ENGAGEMENT_TABS)[number]["value"];

export function readEngagementTab(params: URLSearchParams): EngagementTab {
  const value = params.get(ENGAGEMENT_TAB_PARAM);
  return ENGAGEMENT_TABS.find((tab) => tab.value === value)?.value ?? "details";
}

export function engagementTabSearch(tab: EngagementTab): string {
  return tab === "details"
    ? ""
    : `?${new URLSearchParams({ [ENGAGEMENT_TAB_PARAM]: tab }).toString()}`;
}

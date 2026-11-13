import { formatDate, formatMoney, formatPersonDays } from "@/lib/format";

const labels: Readonly<Record<string, string>> = {
  EngagementCreated: "Engagement created",
  EngagementDetailsUpdated: "Engagement details updated",
  ContractValueChanged: "Contract value changed",
  EngagementClosed: "Engagement closed",
  EngagementReopened: "Engagement reopened",
  MilestoneAdded: "Milestone added",
  MilestoneEdited: "Milestone updated",
  MilestoneDateChanged: "Milestone date changed",
  MilestoneStatusChanged: "Milestone status changed",
  ContactAdded: "Contact added",
  ContactUpdated: "Contact updated",
  ContactRemoved: "Contact removed",
  ClientLinkConfirmed: "Client link confirmed",
  ClientLinkRemoved: "Client link removed",
  LinkCodeIssued: "Link code issued",
};
export const engagementEventLabel = (eventType: string) =>
  labels[eventType] ?? "Engagement updated";
const text = (value: unknown) =>
  typeof value === "string" ? value : "Not recorded";
const number = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;
const currency = (value: unknown) =>
  typeof value === "string" && /^[A-Z]{3}$/.test(value) ? value : null;
export function historyChanges(details: Readonly<Record<string, unknown>>) {
  const pairs: { label: string; previous: string; next: string }[] = [];
  function add(key: string, label: string, format: (value: unknown) => string) {
    if (
      Object.hasOwn(details, `previous${key}`) &&
      Object.hasOwn(details, `new${key}`)
    )
      pairs.push({
        label,
        previous: format(details[`previous${key}`]),
        next: format(details[`new${key}`]),
      });
  }
  add("TargetDate", "Target date", (value) =>
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value))
      ? formatDate(value)
      : "Not recorded",
  );
  add("Status", "Status", text);
  add("Name", "Name", text);
  add("Description", "Description", text);
  add("PlannedEffortPersonDays", "Planned effort", (value) =>
    formatPersonDays(number(value)),
  );
  if (
    Object.hasOwn(details, "previousContractAmount") &&
    Object.hasOwn(details, "newContractAmount")
  )
    pairs.push({
      label: "Contract value",
      previous: formatMoney(
        number(details.previousContractAmount),
        currency(details.previousContractCurrency),
      ),
      next: formatMoney(
        number(details.newContractAmount),
        currency(details.newContractCurrency),
      ),
    });
  return pairs;
}

export type StatusTone = "neutral" | "active" | "attention" | "ended";

export const STATUS_TONES = {
  Active: "active",
  Closed: "ended",
  Draft: "neutral",
  Planned: "neutral",
  Achieved: "active",
  Missed: "attention",
  Retired: "ended",
  Pending: "neutral",
  Accepted: "active",
  Declined: "ended",
  Cancelled: "ended",
  Expired: "attention",
  Removed: "ended",
  Revoked: "ended",
  Left: "ended",
  Shared: "active",
  Internal: "neutral",
  Withdrawn: "ended",
  "Link code outstanding": "attention",
  "No active administrator": "attention",
} as const satisfies Readonly<Record<string, StatusTone>>;

export function statusTone(label: string): StatusTone {
  return (
    Object.entries(STATUS_TONES).find(([name]) => name === label)?.[1] ??
    "neutral"
  );
}

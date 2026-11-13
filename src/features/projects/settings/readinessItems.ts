import type { ActivationRejected } from "@/features/projects/api/types";
export type ReadinessGap = ActivationRejected["gaps"][number];
export const READINESS_LABELS = {
  ProductGoal: "Product Goal written",
  SprintLength: "Sprint length set",
  ProjectManager: "At least one PM on the team",
  Engagement: "Engagement selected",
  ClientProductOwnerWaiver: "Client Product Owner assigned",
} as const satisfies Record<ReadinessGap, string>;
export const ACTIVATION_CONSEQUENCE =
  "Activating marks the project ready for delivery. It does not accept scope or requirements. Active projects can't return to Draft.";

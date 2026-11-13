import { z } from "zod";
import type { Stakeholder } from "@/features/projects/api/types";
export const stakeholderForm = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a name.")
    .max(200, "Use 200 characters or fewer."),
  side: z.enum(["Vendor", "Client"]),
  organizationName: z.string().trim().max(200, "Use 200 characters or fewer."),
  responsibilities: z
    .string()
    .trim()
    .max(2000, "Use 2,000 characters or fewer."),
  decisionAreas: z.string().trim().max(2000, "Use 2,000 characters or fewer."),
  email: z
    .string()
    .trim()
    .refine(
      (value) => !value || z.email().safeParse(value).success,
      "Enter a valid email address.",
    ),
  participantId: z.string(),
});
export type StakeholderValues = z.infer<typeof stakeholderForm>;
export function stakeholderValues(row?: Stakeholder): StakeholderValues {
  return {
    name: row?.name ?? "",
    side: row?.side ?? "Client",
    organizationName: row?.organizationName ?? "",
    responsibilities: row?.responsibilities ?? "",
    decisionAreas: row?.decisionAreas ?? "",
    email: row?.email ?? "",
    participantId: row?.participantId ?? "",
  };
}

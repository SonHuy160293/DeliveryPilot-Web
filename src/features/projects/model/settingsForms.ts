import { z } from "zod";
import { isUuid } from "@/lib/routes";
export const changeEngagementForm = z
  .object({
    kind: z.enum(["Client", "Internal"]),
    engagementId: z.string(),
    reason: z
      .string()
      .trim()
      .min(1, "Enter a reason.")
      .max(2000, "Use 2,000 characters or fewer."),
  })
  .refine((values) => values.kind !== "Client" || isUuid(values.engagementId), {
    path: ["engagementId"],
    message: "Choose the engagement this project delivers.",
  });
export type ChangeEngagementValues = z.infer<typeof changeEngagementForm>;

import { z } from "zod";
import { uuid } from "@/features/projects/api/contracts";
export const createProjectForm = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Enter a project name.")
      .max(160, "Use 160 characters or fewer."),
    purpose: z
      .string()
      .trim()
      .min(1, "Describe the project's purpose.")
      .max(500, "Use 500 characters or fewer."),
    kind: z.enum(["Client", "Internal"]),
    engagementId: z.string(),
  })
  .refine(
    (values) =>
      values.kind !== "Client" || uuid.safeParse(values.engagementId).success,
    {
      path: ["engagementId"],
      message: "Choose the engagement this project delivers.",
    },
  );
export type CreateProjectValues = z.infer<typeof createProjectForm>;

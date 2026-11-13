import { z } from "zod";
const stateSchema = z.object({
  projectCreated: z.literal(true),
  projectId: z.string(),
  mock: z.literal(true),
});
export function projectCreationMessage(state: unknown, projectId: string) {
  const result = stateSchema.safeParse(state);
  return result.success && result.data.projectId === projectId
    ? "Project created. You are its project administrator."
    : null;
}

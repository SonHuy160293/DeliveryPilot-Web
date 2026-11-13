import { z } from "zod";
const joined = z.object({
  projectGuestJoined: z.literal(true),
  projectId: z.string(),
  projectName: z.string().trim().min(1).max(160),
  mock: z.literal(true),
});
/** Presentation only; navigation state never authorizes a project read. */
export function projectJoinMessage(
  state: unknown,
  projectId: string | undefined,
) {
  const parsed = joined.safeParse(state);
  return parsed.success && parsed.data.projectId === projectId
    ? `You joined ${parsed.data.projectName}.`
    : null;
}

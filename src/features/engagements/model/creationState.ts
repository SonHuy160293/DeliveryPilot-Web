import { z } from "zod";
const creationState = z.object({
  engagementCreated: z.literal(true),
  duplicateAgreementReference: z.boolean().optional(),
});
export function readCreationState(state: unknown) {
  return creationState.safeParse(state).data;
}

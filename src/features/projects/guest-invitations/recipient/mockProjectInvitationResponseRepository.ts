import { getProjectRecipientRepository } from "@/features/projects/api/projectRepository";
import type { ProjectInvitationResponseRepository } from "@/features/projects/guest-invitations/recipient/projectInvitationResponseRepository";
/** One shared project store owns vendor invitations and guest admission. */
export const mockProjectInvitationResponseRepository: ProjectInvitationResponseRepository =
  {
    kind: "mock",
    preview: (id, proof, signal) =>
      getProjectRecipientRepository().preview(id, proof, signal),
    accept: (id, proof, version, signal) =>
      getProjectRecipientRepository().accept(id, proof, version, signal),
    decline: (id, proof, version, signal) =>
      getProjectRecipientRepository().decline(id, proof, version, signal),
  };

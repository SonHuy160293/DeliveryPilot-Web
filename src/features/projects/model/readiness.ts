import type {
  ProjectDetail,
  ProjectBrief,
  Participant,
  ActivationRejected,
} from "@/features/projects/api/types";
export function computeReadiness(
  project: Pick<
    ProjectDetail,
    "kind" | "engagement" | "clientProductOwner" | "clientPoWaiverReason"
  > & { sprintLengthWeeks: number | null },
  brief: Pick<ProjectBrief, "productGoal">,
  participants: readonly Participant[],
): ActivationRejected["gaps"] {
  const gaps: ActivationRejected["gaps"] = [];
  if (!brief.productGoal?.trim()) gaps.push("ProductGoal");
  if (
    project.sprintLengthWeeks === null ||
    ![1, 2, 3, 4].includes(project.sprintLengthWeeks)
  )
    gaps.push("SprintLength");
  if (
    !participants.some(
      (item) =>
        item.status === "Active" && item.roles.includes("ProjectManager"),
    )
  )
    gaps.push("ProjectManager");
  if (project.kind === "Client") {
    if (!project.engagement) gaps.push("Engagement");
    const po = project.clientProductOwner;
    if (
      !participants.some(
        (item) =>
          item.kind === "Guest" &&
          item.status === "Active" &&
          item.id === po?.participantId,
      ) &&
      !project.clientPoWaiverReason?.trim()
    )
      gaps.push("ClientProductOwnerWaiver");
  }
  return gaps;
}

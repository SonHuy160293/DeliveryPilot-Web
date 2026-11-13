import { getProjectRepository } from "@/features/projects/api/projectRepository";
import { draftProject, projectPerson } from "@/test/fixtures/projectMock";
/** Prepare readiness through the same authorized commands, never through UI URL state. */
export async function prepareDraft(workspaceId: string) {
  const repo = getProjectRepository(),
    id = draftProject.detail.id;
  const people = await repo.listParticipants(workspaceId, id),
    me = people.find((person) => person.userId === projectPerson("u-linh").id);
  if (!me) throw new Error("Missing Draft administrator");
  await repo.changeRoles(workspaceId, id, me.id, {
    roles: ["ProjectAdministrator", "ProjectManager"],
    expectedVersion: me.version,
  });
  const brief = await repo.getBrief(workspaceId, id);
  await repo.updateBriefItem(workspaceId, id, {
    item: "ProductGoal",
    value: "Launch fleet telemetry",
    expectedVersion: brief.version,
  });
  return id;
}

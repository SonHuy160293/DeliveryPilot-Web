import { createMockProjectRepository } from "@/features/projects/api/mockProjectRepository";
import { projectEngagementAdapter } from "@/mocks/projectEngagementAdapter";
import { projectFixtures, supplementalProjectFixtures } from "@/mocks/projects";
import { MOCK_PEOPLE, type MockPersonaKey } from "@/mocks/people";
export const projectWorkspace = "019a1000-0000-7000-8000-000000000099";
function fixture(index: number) {
  const value = projectFixtures[index];
  if (!value) throw new Error("Missing project fixture");
  return value;
}
export const firstProject = fixture(0),
  draftProject = fixture(1),
  internalProject = fixture(2);
export function orphanProject() {
  const value = supplementalProjectFixtures[0];
  if (!value) throw new Error("Missing orphan fixture");
  return value;
}
export function projectPerson(key: MockPersonaKey) {
  const value = MOCK_PEOPLE.find((item) => item.key === key);
  if (!value) throw new Error("Missing persona");
  return value;
}
export const createProjectMock = () =>
  createMockProjectRepository(projectEngagementAdapter);

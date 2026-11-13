import { describe, expect, it } from "vitest";
import * as shapes from "@/features/projects/api/contracts";
import {
  projectFixtures,
  supplementalProjectFixtures,
  participantFixtures,
  supplementalParticipantFixtures,
  guestInvitationFixtures,
  projectInvitationPreviewFixture,
  stakeholderFixtures,
  projectEventFixtures,
  orphanedProjectFixtures,
} from "@/mocks/projects";
describe("project planning contracts", () => {
  it("parses every supplied and approved supplemental fixture", () => {
    for (const item of [...projectFixtures, ...supplementalProjectFixtures]) {
      expect(shapes.projectDetail.parse(item.detail)).toEqual(item.detail);
      expect(shapes.projectBrief.parse(item.brief)).toEqual(item.brief);
    }
    for (const items of Object.values({
      ...participantFixtures,
      ...supplementalParticipantFixtures,
    }))
      for (const item of items)
        expect(shapes.participant.parse(item)).toEqual(item);
    for (const items of Object.values(guestInvitationFixtures))
      for (const item of items)
        expect(shapes.guestInvitation.parse(item)).toEqual(item);
    for (const items of Object.values(stakeholderFixtures))
      for (const item of items)
        expect(shapes.stakeholder.parse(item)).toEqual(item);
    for (const item of projectEventFixtures)
      expect(shapes.projectEvent.parse(item)).toEqual(item);
    for (const item of orphanedProjectFixtures)
      expect(shapes.orphanedProject.parse(item)).toEqual(item);
    expect(
      shapes.invitationPreview.parse(projectInvitationPreviewFixture),
    ).toEqual(projectInvitationPreviewFixture);
  });
  it("trims before enforcing project limits and requires the correct engagement pairing", () => {
    const request = {
      name: " Project ",
      purpose: " Purpose ",
      kind: "Internal",
      engagementId: null,
    };
    expect(shapes.createProjectRequest.parse(request)).toMatchObject({
      name: "Project",
      purpose: "Purpose",
    });
    for (const invalid of [
      { name: "N".repeat(161) },
      { purpose: "P".repeat(501) },
      { name: " " },
      { purpose: " " },
      { kind: "Client" },
      { engagementId: crypto.randomUUID() },
    ])
      expect(
        shapes.createProjectRequest.safeParse({ ...request, ...invalid })
          .success,
      ).toBe(false);
  });
  it("excludes administrator guest roles and empty role assignments", () => {
    expect(
      shapes.inviteGuestRequest.safeParse({
        recipientEmail: "guest@example.com",
        offeredRoleCode: "ProjectAdministrator",
      }).success,
    ).toBe(false);
    expect(
      shapes.changeRolesRequest.safeParse({ roles: [], expectedVersion: 1 })
        .success,
    ).toBe(false);
    expect(
      shapes.inviteGuestRequest.parse({
        recipientEmail: " GUEST@example.com ",
        offeredRoleCode: "Viewer",
      }).recipientEmail,
    ).toBe("guest@example.com");
    expect(
      shapes.inviteGuestRequest.safeParse({
        recipientEmail: "invalid",
        offeredRoleCode: "Viewer",
      }).success,
    ).toBe(false);
  });
});

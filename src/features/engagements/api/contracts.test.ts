import { describe, expect, it } from "vitest";
import {
  engagementFixtures,
  engagementHistoryFixtures,
} from "@/mocks/engagements";
import {
  engagementDetail,
  engagementPage,
  historyPage,
  engagementHistoryEntry,
  createEngagementRequest,
  setContractValueRequest,
} from "@/features/engagements/api/contracts";
import { createFormSchema } from "@/features/engagements/model/createForm";

describe("engagement planning contracts", () => {
  it("parses every engagement, contact, milestone and history fixture", () => {
    expect(engagementPage.parse(engagementFixtures).items).toHaveLength(3);
    for (const row of engagementFixtures.items)
      expect(engagementDetail.parse(row)).toEqual(row);
    expect(historyPage.parse(engagementHistoryFixtures).items).toHaveLength(5);
    for (const row of engagementHistoryFixtures.items)
      expect(engagementHistoryEntry.parse(row)).toEqual(row);
  });
  it("trims before enforcing the create limits", () => {
    const input = {
      clientDisplayName: ` ${"N".repeat(200)} `,
      agreementReference: " reference ",
      agreementSignedOn: "2026-11-02",
    };
    expect(createEngagementRequest.parse(input).clientDisplayName).toHaveLength(
      200,
    );
    expect(
      createEngagementRequest.safeParse({
        ...input,
        clientDisplayName: "N".repeat(201),
      }).success,
    ).toBe(false);
    expect(
      createEngagementRequest.safeParse({
        ...input,
        agreementReference: "R".repeat(101),
      }).success,
    ).toBe(false);
    expect(
      createEngagementRequest.safeParse({
        ...input,
        agreementSignedOn: "2026-02-30",
      }).success,
    ).toBe(false);
    expect(
      createEngagementRequest.safeParse({
        ...input,
        documentUrl: "http://example.com",
      }).success,
    ).toBe(false);
    expect(
      createEngagementRequest.safeParse({ ...input, clientCountryCode: "ZZZ" })
        .success,
    ).toBe(false);
  });
  it("normalizes optional form values and uppercase country codes", () => {
    const result = createFormSchema.parse({
      clientDisplayName: " Client ",
      agreementReference: " REF ",
      agreementSignedOn: "2026-11-02",
      engagementName: "",
      clientLegalName: "",
      clientCountryCode: "au",
      documentUrl: "",
    });
    expect(result).toMatchObject({
      clientDisplayName: "Client",
      agreementReference: "REF",
      clientCountryCode: "AU",
      documentUrl: null,
      engagementName: null,
    });
  });
  it("enforces amount/effort precision and nullable missing values", () => {
    const request = {
      expectedVersion: 1,
      contractAmount: null,
      contractCurrency: null,
      plannedEffortPersonDays: null,
      reason: null,
    };
    expect(setContractValueRequest.parse(request)).toEqual(request);
    expect(
      setContractValueRequest.safeParse({
        ...request,
        contractAmount: 1.234,
        contractCurrency: "AUD",
      }).success,
    ).toBe(false);
    expect(
      setContractValueRequest.safeParse({
        ...request,
        plannedEffortPersonDays: 1.23,
      }).success,
    ).toBe(false);
    expect(
      setContractValueRequest.safeParse({ ...request, contractAmount: 1 })
        .success,
    ).toBe(false);
    expect(
      setContractValueRequest.safeParse({
        ...request,
        contractAmount: -1,
        contractCurrency: "AUD",
      }).success,
    ).toBe(false);
  });
});

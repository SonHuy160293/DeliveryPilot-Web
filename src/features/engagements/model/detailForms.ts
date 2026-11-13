import { z } from "zod";
import type { EngagementDetail } from "@/features/engagements/api/types";

const optionalReason = z
  .string()
  .trim()
  .max(2000, "Use 2,000 characters or fewer.");
export const reasonForm = z.object({
  reason: optionalReason.min(1, "Enter a reason."),
});
const decimalText = (places: number) =>
  z
    .string()
    .trim()
    .refine(
      (value) =>
        value === "" ||
        (new RegExp(`^\\d+(?:\\.\\d{1,${String(places)}})?$`).test(value) &&
          Number.isFinite(Number(value))),
      `Enter a non-negative number with up to ${places === 1 ? "one decimal place" : "two decimal places"}.`,
    );
export const contractForm = z
  .object({
    contractAmount: decimalText(2),
    contractCurrency: z
      .string()
      .trim()
      .toUpperCase()
      .refine(
        (value) => value === "" || /^[A-Z]{3}$/.test(value),
        "Enter a three-letter currency code.",
      ),
    plannedEffortPersonDays: decimalText(1),
    reason: optionalReason,
    clear: z.boolean(),
  })
  .refine(
    (input) =>
      input.clear ||
      input.contractAmount === "" ||
      input.contractCurrency !== "",
    {
      path: ["contractCurrency"],
      message: "Record a currency for the amount.",
    },
  );
export const milestoneForm = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a milestone name.")
    .max(200, "Use 200 characters or fewer."),
  description: z.string().trim().max(2000, "Use 2,000 characters or fewer."),
});
export const addMilestoneForm = milestoneForm.extend({
  targetDate: z.iso.date("Enter a target date."),
});
export const dateForm = reasonForm.extend({
  targetDate: z.iso.date("Enter a target date."),
});
export const statusForm = z.object({
  status: z.enum(["Achieved", "Missed", "Retired"], {
    error: "Choose a status.",
  }),
  reason: optionalReason,
});
export function contractValues(row: EngagementDetail) {
  return {
    contractAmount: row.contractAmount?.toString() ?? "",
    contractCurrency: row.contractCurrency ?? "",
    plannedEffortPersonDays: row.plannedEffortPersonDays?.toString() ?? "",
    reason: "",
    clear: false,
  };
}
export const optionalNumber = (value: string) =>
  value === "" ? null : Number(value);

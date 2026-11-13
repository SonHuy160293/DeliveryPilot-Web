import { z } from "zod";
export const createFormSchema = z
  .object({
    clientDisplayName: z
      .string()
      .trim()
      .min(1, "Enter the client's display name.")
      .max(200, "Use 200 characters or fewer."),
    agreementReference: z
      .string()
      .trim()
      .min(1, "Enter the agreement reference.")
      .max(100, "Use 100 characters or fewer."),
    agreementSignedOn: z.iso.date("Enter the date the agreement was signed."),
    engagementName: z.string().trim().max(200, "Use 200 characters or fewer."),
    clientLegalName: z.string().trim().max(200, "Use 200 characters or fewer."),
    clientCountryCode: z
      .string()
      .trim()
      .toUpperCase()
      .refine(
        (value) => !value || /^[A-Z]{2}$/.test(value),
        "Enter a 2-letter country code, for example VN.",
      ),
    documentUrl: z
      .string()
      .trim()
      .max(2000, "Use 2000 characters or fewer.")
      .refine((value) => {
        if (!value) return true;
        try {
          return new URL(value).protocol === "https:";
        } catch {
          return false;
        }
      }, "Enter a link that starts with https://."),
  })
  .transform((values) => ({
    ...values,
    engagementName: values.engagementName || null,
    clientLegalName: values.clientLegalName || null,
    clientCountryCode: values.clientCountryCode || null,
    documentUrl: values.documentUrl || null,
  }));
export type CreateFormValues = z.input<typeof createFormSchema>;
export type CreateFormRequest = z.output<typeof createFormSchema>;
export const emptyCreateValues: CreateFormValues = {
  clientDisplayName: "",
  agreementReference: "",
  agreementSignedOn: "",
  engagementName: "",
  clientLegalName: "",
  clientCountryCode: "",
  documentUrl: "",
};

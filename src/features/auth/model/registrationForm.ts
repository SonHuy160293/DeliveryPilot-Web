import { z } from "zod";
import { ApiError } from "@/lib/api/apiError";

export const registrationSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Enter your display name.")
    .max(160, "Use at most 160 characters."),
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address.")
    .max(320, "Use at most 320 characters.")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address."),
  password: z
    .string()
    .refine((value) => value.trim().length > 0, "Enter your password."),
});
export type RegistrationValues = z.infer<typeof registrationSchema>;

export function registrationMessage(error: unknown): string {
  if (!(error instanceof ApiError))
    return "Account creation could not be confirmed. Try signing in before submitting again.";
  if (
    error.kind === "conflict" &&
    error.details.code === "Registration.EmailExists"
  )
    return "An account already uses this email. Sign in to continue.";
  if (error.kind === "rate-limit")
    return "Too many attempts. Wait before trying again.";
  if (error.kind === "bad-request" || error.kind === "validation")
    return "Check your display name, email and password, then try again.";
  if (error.kind === "forbidden" || error.kind === "unauthenticated")
    return "Account creation is unavailable. Contact your administrator.";
  if (error.kind === "configuration")
    return "Account creation is not configured. Contact your administrator.";
  return "Account creation could not be confirmed. Try signing in before submitting again.";
}

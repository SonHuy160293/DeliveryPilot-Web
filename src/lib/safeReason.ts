import { z } from "zod";

export const safeReason = z
  .string()
  .trim()
  .min(1, "Enter a reason.")
  .max(1000, "Use 1,000 characters or fewer.")
  .refine(
    (value) =>
      !/(?:https?:\/\/|www\.|\b\S+@\S+\.\S+|bearer\s|(?:token|password|secret)\s*=)/i.test(
        value,
      ),
    "Use a business reason without links, email addresses, or credentials.",
  );

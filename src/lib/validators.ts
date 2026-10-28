import { z } from "zod";
import { PURPOSES } from "@/lib/constants";

export const publicCodeSchema = z.string().trim().regex(/^[A-HJ-NP-Z2-9]{8}$/);
export const uuidSchema = z.string().uuid();

export const issueSchema = z.object({
  counter_id: uuidSchema,
  customer_name: z
    .string()
    .trim()
    .max(80)
    .refine((value) => value === "" || /^[\p{L}][\p{L}\s.'-]{1,79}$/u.test(value), {
      message: "invalid_name",
    }),
  purpose: z.enum(PURPOSES),
  client_key: uuidSchema.refine((value) => value !== "00000000-0000-0000-0000-000000000000", {
    message: "invalid_client",
  }),
});

export const counterInputSchema = z.object({
  id: z.preprocess(
    (value) => (value === "" || value == null ? null : value),
    uuidSchema.nullable(),
  ),
  name: z.string().trim().min(3).max(80),
  code: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{2,6}$/)
    .transform((value) => value.toUpperCase()),
  location: z.string().trim().min(3).max(120),
  avgMinutes: z.coerce.number().int().min(1).max(60),
  isActive: z.boolean(),
});

export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export function issueErrorCode(error: z.ZodError) {
  const issue = error.issues[0];
  if (!issue) return "invalid_counter";
  if (issue.message === "invalid_name" || issue.path[0] === "customer_name") return "invalid_name";
  if (issue.path[0] === "purpose") return "invalid_purpose";
  if (issue.message === "invalid_client" || issue.path[0] === "client_key") return "invalid_client";
  return "invalid_counter";
}

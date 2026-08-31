import { z } from "zod";

export const recurrences = ["DAILY", "WEEKDAYS", "CUSTOM"] as const;

const baseGoalSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  points: z.coerce.number().finite().positive().max(10000),
  count: z.coerce.number().int().min(1).max(100).default(1),
  recurrence: z.enum(recurrences),
  customDays: z.array(z.number().int().min(0).max(6)).optional(),
  category: z.string().trim().max(60).optional().nullable(),
});

export const createGoalSchema = baseGoalSchema.superRefine((val, ctx) => {
  if (val.recurrence === "CUSTOM" && (!val.customDays || val.customDays.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Select at least one day for a custom recurrence",
      path: ["customDays"],
    });
  }
});

// No superRefine here — .partial() can't be applied to a refined schema, and
// the PATCH handler already falls back to the existing goal's recurrence for
// any field the caller omits, so cross-field validation isn't needed here.
export const updateGoalSchema = baseGoalSchema.partial().extend({
  active: z.boolean().optional(),
});

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  inviteCode: z.string().min(1, "Invite code is required"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const toggleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  subIndex: z.coerce.number().int().min(0),
  completed: z.boolean(),
});

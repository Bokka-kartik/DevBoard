import { z } from "zod";
import { GraphQLError } from "graphql";

// ── Auth ──────────────────────────────────────────────────────────────────────
export const RegisterInput = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username may only contain letters, numbers, and underscores"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const LoginInput = z.object({
  usernameOrEmail: z.string().min(1, "Required"),
  password: z.string().min(1, "Required"),
});

// ── Board ─────────────────────────────────────────────────────────────────────
export const BoardNameInput = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name too long"),
});

// ── Column ────────────────────────────────────────────────────────────────────
export const ColumnTitleInput = z.object({
  title: z.string().trim().min(1, "Title is required").max(50, "Title too long"),
});

// ── Card ──────────────────────────────────────────────────────────────────────
export const CardCreateInput = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(2000, "Description too long").optional(),
});

export const CardUpdateInput = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title too long").optional(),
  description: z.string().max(2000, "Description too long").optional(),
  labels: z.array(z.string().max(30)).max(10, "Too many labels").optional(),
  dueDate: z
    .string()
    .refine((d) => !d || !Number.isNaN(Date.parse(d)), "Invalid date")
    .optional(),
});

// ── Utility ───────────────────────────────────────────────────────────────────
// Parses a Zod schema and throws a GraphQL BAD_USER_INPUT error on failure.
export const validate = <T>(schema: z.ZodType<T>, input: unknown): T => {
  const result = schema.safeParse(input);
  if (!result.success) {
    const message = result.error.errors.map((e) => e.message).join("; ");
    throw new GraphQLError(message, {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }
  return result.data;
};

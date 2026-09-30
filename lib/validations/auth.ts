import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
})

export const passwordSchema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters").max(72),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: "Passwords don't match", path: ["confirm"] })

export type LoginInput = z.infer<typeof loginSchema>
export type PasswordInput = z.infer<typeof passwordSchema>

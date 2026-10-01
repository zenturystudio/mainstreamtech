import { z } from "zod"
import { RESERVED_SLUGS } from "@/lib/urls"

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Slug is required")
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens")

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null)
    .nullable()
    .optional()

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  slug,
  description: optionalText(300),
})

export const tagSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(40),
  slug,
})

export const postSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200),
    // Stories live at /{slug}, so a slug can't clash with an existing page.
    slug: slug.refine((s) => !(RESERVED_SLUGS as readonly string[]).includes(s), {
      message: "This address is used by another page on the site. Choose a different slug.",
    }),
    excerpt: optionalText(400),
    content: z.string().max(500_000),
    cover_image_url: z.string().url().nullable().optional().or(z.literal("").transform(() => null)),
    status: z.enum(["draft", "published", "scheduled"]),
    published_at: z.string().datetime({ offset: true }).nullable().optional(),
    category_id: z.string().uuid().nullable().optional().or(z.literal("").transform(() => null)),
    tag_ids: z.array(z.string().uuid()).max(20).default([]),
    featured: z.boolean().default(false),
    meta_title: optionalText(70),
    meta_description: optionalText(170),
    // Plain-text Q&A pairs, rendered at the end of the story and as FAQPage schema.
    faqs: z
      .array(
        z.object({
          question: z.string().trim().min(1, "Each FAQ needs a question").max(200, "FAQ questions are limited to 200 characters"),
          answer: z.string().trim().min(1, "Each FAQ needs an answer").max(2000, "FAQ answers are limited to 2,000 characters"),
        })
      )
      .max(20, "Up to 20 FAQs per story")
      .default([]),
  })
  .superRefine((v, ctx) => {
    if (v.status === "scheduled") {
      if (!v.published_at) ctx.addIssue({ code: "custom", path: ["published_at"], message: "Pick a date and time to publish" })
      else if (new Date(v.published_at).getTime() <= Date.now())
        ctx.addIssue({ code: "custom", path: ["published_at"], message: "Scheduled time must be in the future" })
    }
  })

export const settingsSchema = z.object({
  site_name: z.string().trim().min(2).max(80),
  site_description: optionalText(300),
  logo_url: z.string().url().nullable().optional().or(z.literal("").transform(() => null)),
  posts_per_page: z.coerce.number().int().min(1).max(50),
  social_links: z.object({
    x: z.string().url().or(z.literal("")).optional(),
    facebook: z.string().url().or(z.literal("")).optional(),
    linkedin: z.string().url().or(z.literal("")).optional(),
    youtube: z.string().url().or(z.literal("")).optional(),
    instagram: z.string().url().or(z.literal("")).optional(),
  }),
})

export const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_-]{3,32}$/, "3–32 characters: lowercase letters, numbers, - or _"),
  bio: optionalText(500),
  avatar_url: z.string().url().nullable().optional().or(z.literal("").transform(() => null)),
})

export const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  full_name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  role: z.enum(["admin", "author"]),
})

export type CategoryInput = z.input<typeof categorySchema>
export type TagInput = z.input<typeof tagSchema>
export type PostInput = z.input<typeof postSchema>
export type SettingsInput = z.input<typeof settingsSchema>
export type ProfileInput = z.input<typeof profileSchema>
export type InviteInput = z.input<typeof inviteSchema>

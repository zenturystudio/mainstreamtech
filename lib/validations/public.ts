import { z } from "zod"

const email = z.string().trim().toLowerCase().email("Enter a valid email address").max(254)

// `website` is a honeypot: hidden from people, often filled in by bots.
// Checked in the action (not here) so bots get a fake success, not an error.
const honeypot = z.string().optional()

export const newsletterSchema = z.object({
  email,
  website: honeypot,
})

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email,
  subject: z.string().trim().min(3, "Subject is too short").max(150),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(5000),
  website: honeypot,
})

export type NewsletterInput = z.infer<typeof newsletterSchema>
export type ContactInput = z.infer<typeof contactSchema>

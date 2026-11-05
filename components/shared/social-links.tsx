import { FaFacebookF, FaInstagram, FaLinkedinIn, FaXTwitter, FaYoutube } from "react-icons/fa6"
import { getSiteSettings } from "@/lib/queries/public"
import { cn } from "@/lib/utils"

const NETWORKS = [
  { key: "x", label: "X (Twitter)", Icon: FaXTwitter },
  { key: "facebook", label: "Facebook", Icon: FaFacebookF },
  { key: "linkedin", label: "LinkedIn", Icon: FaLinkedinIn },
  { key: "youtube", label: "YouTube", Icon: FaYoutube },
  { key: "instagram", label: "Instagram", Icon: FaInstagram },
] as const

/** Social profiles from Settings in the CMS. Nothing shows until real profile URLs are saved there. */
export async function SocialLinks({ className }: { className?: string }) {
  const settings = await getSiteSettings()
  const links = settings.social_links
  const items = NETWORKS.filter((n) => links[n.key])
  if (!items.length) return null

  return (
    <ul className={cn("flex items-center gap-2", className)}>
      {items.map(({ key, label, Icon }) => (
        <li key={key}>
          <a
            href={links[key]}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="grid size-9 place-items-center rounded-full border text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
          >
            <Icon className="size-4" aria-hidden />
          </a>
        </li>
      ))}
    </ul>
  )
}

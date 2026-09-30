import { ImageResponse } from "next/og"
import { getPostBySlug } from "@/lib/queries/public"
import { siteConfig } from "@/lib/site"

export const alt = "Mainstream Tech story"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

/** Fetches Playfair Display (bold) as TTF, subset to the characters used. */
async function loadPlayfair(text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&text=${encodeURIComponent(text)}`)).text()
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1]
    return url ? await (await fetch(url)).arrayBuffer() : null
  } catch {
    return null
  }
}

/** Branded share card: cover image, section, headline and byline. */
export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const post = await getPostBySlug((await params).slug)
  const title = post?.title ?? siteConfig.name
  const playfair = await loadPlayfair(`${title}mainstream`)

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", position: "relative", background: "#141414", color: "white", fontFamily: playfair ? "Playfair" : "serif" }}>
        {post?.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.cover_image_url} alt="" width={1200} height={630} style={{ position: "absolute", inset: 0, objectFit: "cover", opacity: 0.45 }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,10,10,0.95) 30%, rgba(10,10,10,0.2))" }} />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: -1 }}>mainstream</span>
            <span style={{ fontSize: 30, fontFamily: "sans-serif", marginLeft: -6 }}>tech</span>
            {post?.category && (
              <span style={{ marginLeft: 24, padding: "6px 16px", borderRadius: 999, background: "#ffffff", color: "#141414", fontSize: 22, fontFamily: "sans-serif", fontWeight: 600 }}>
                {post.category.name}
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ fontSize: title.length > 70 ? 54 : 64, fontWeight: 700, lineHeight: 1.1, letterSpacing: -1.5 }}>{title}</div>
            {post && (
              <div style={{ fontSize: 24, fontFamily: "sans-serif", color: "rgba(255,255,255,0.75)" }}>
                {`${post.author.full_name} · ${post.reading_time} min read`}
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: playfair ? [{ name: "Playfair", data: playfair, weight: 700, style: "normal" }] : undefined }
  )
}

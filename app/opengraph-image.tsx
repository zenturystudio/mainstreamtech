import { ImageResponse } from "next/og"
import { siteConfig } from "@/lib/site"

export const alt = "Mainstream Tech: News, Tech & Analysis"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

/** Default share card for every page without its own (story pages override it). */
export default async function OgImage() {
  let playfair: ArrayBuffer | null = null
  try {
    const css = await (await fetch("https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&text=mainstreamNews%2CTech%26Analysis")).text()
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1]
    if (url) playfair = await (await fetch(url)).arrayBuffer()
  } catch {
    playfair = null
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: 72,
          background: "#141414",
          color: "white",
          fontFamily: playfair ? "Playfair" : "serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <span style={{ fontSize: 64, fontWeight: 700, letterSpacing: -2 }}>mainstream</span>
          <span style={{ fontSize: 54, fontFamily: "sans-serif" }}>tech</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>News, Tech & Analysis</div>
          <div style={{ fontSize: 28, fontFamily: "sans-serif", color: "rgba(255,255,255,0.7)" }}>{siteConfig.description}</div>
        </div>
      </div>
    ),
    { ...size, fonts: playfair ? [{ name: "Playfair", data: playfair, weight: 700, style: "normal" }] : undefined }
  )
}

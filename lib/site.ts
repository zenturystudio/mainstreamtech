export const siteConfig = {
  name: "Mainstream Tech",
  tagline: "News, Tech & Analysis",
  description: "News and analysis on technology, AI, business, politics and international affairs, from our newsroom in London.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3003",
  email: "info@mainstreamtech.co.uk",
  location: "London, United Kingdom",
  nav: [
    { label: "Home", href: "/" },
    { label: "Latest", href: "/blog" },
    { label: "Trending", href: "/blog?sort=popular" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  social: {
    x: "https://x.com",
    facebook: "https://facebook.com",
    linkedin: "https://linkedin.com",
    youtube: "https://youtube.com",
  },
} as const

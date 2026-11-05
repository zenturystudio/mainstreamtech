import { notFound } from "next/navigation"
import { getTagBySlug } from "@/lib/queries/public"

// Checks the tag exists *above* loading.tsx: notFound() inside the loading
// boundary only runs after streaming starts, so a missing tag came back as
// 200 + noindex (a soft 404). Here it returns a real 404. getTagBySlug is
// cached per request, so the page reuses this lookup.
export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  if (!(await getTagBySlug((await params).slug))) notFound()
  return children
}

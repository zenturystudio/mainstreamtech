import { notFound } from "next/navigation"
import { getPostBySlug } from "@/lib/queries/public"

// Checks the story exists *above* loading.tsx: notFound() inside the loading
// boundary only runs after streaming starts, so a missing story came back as
// 200 + noindex (a soft 404). Here it returns a real 404. getPostBySlug is
// cached per request, so the page reuses this lookup.
export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  if (!(await getPostBySlug((await params).slug))) notFound()
  return children
}

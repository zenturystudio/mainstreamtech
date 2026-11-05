import { notFound } from "next/navigation"
import { getCategoryBySlug } from "@/lib/queries/public"

// Checks the category exists *above* loading.tsx: notFound() inside the loading
// boundary only runs after streaming starts, so a missing category came back as
// 200 + noindex (a soft 404). Here it returns a real 404. getCategoryBySlug is
// cached per request, so the page reuses this lookup.
export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  if (!(await getCategoryBySlug((await params).slug))) notFound()
  return children
}

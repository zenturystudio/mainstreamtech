import { notFound } from "next/navigation"
import { getAuthorByUsername } from "@/lib/queries/public"

// Checks the author exists *above* loading.tsx: notFound() inside the loading
// boundary only runs after streaming starts, so a missing author came back as
// 200 + noindex (a soft 404). Here it returns a real 404. getAuthorByUsername is
// cached per request, so the page reuses this lookup.
export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ username: string }> }) {
  if (!(await getAuthorByUsername((await params).username))) notFound()
  return children
}

import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { Plus } from "lucide-react"
import { PageHeading } from "@/components/admin/page-heading"
import { PostsFilters } from "@/components/admin/posts-filters"
import { PostsTable } from "@/components/admin/posts-table"
import { Pagination } from "@/components/shared/pagination"
import { Button } from "@/components/ui/button"
import { requireUser } from "@/lib/auth"
import { getAuthorsForFilter, getCategoriesWithCounts, listPosts, type PostSort } from "@/lib/queries/admin"
import { siteOrigin } from "@/lib/urls"

export const metadata: Metadata = { title: "Posts" }

type SearchParams = { q?: string; status?: string; category?: string; author?: string; sort?: string; page?: string }

export default async function PostsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [session, params] = await Promise.all([requireUser(), searchParams])
  const sort = (["updated", "published", "views", "title"].includes(params.sort ?? "") ? params.sort : "updated") as PostSort

  const [result, categories, authors] = await Promise.all([
    listPosts(session, { ...params, sort, page: Number(params.page) || 1 }),
    getCategoriesWithCounts(),
    session.isAdmin ? getAuthorsForFilter() : Promise.resolve(null),
  ])
  const filtered = Boolean(params.q || params.status || params.category || params.author)

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeading
        title="Posts"
        description={session.isAdmin ? `${result.total} ${result.total === 1 ? "post" : "posts"} across the site.` : `${result.total} of your posts.`}
        actions={
          <Button asChild className="h-9">
            <Link href="/admin/posts/new">
              <Plus /> New post
            </Link>
          </Button>
        }
      />

      <div className="overflow-hidden rounded-2xl border bg-background">
        <Suspense>
          <PostsFilters
            categories={categories.map((c) => ({ id: c.id, name: c.name }))}
            authors={authors?.map((a) => ({ id: a.id, name: a.full_name || a.username || "Unnamed" })) ?? null}
          />
        </Suspense>
        <PostsTable posts={result.posts} siteBase={siteOrigin()} showAuthor={session.isAdmin} filtered={filtered} />
      </div>

      <div className="mt-8">
        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          basePath="/admin/posts"
          params={{ q: params.q, status: params.status, category: params.category, author: params.author, sort: params.sort }}
        />
      </div>
    </div>
  )
}

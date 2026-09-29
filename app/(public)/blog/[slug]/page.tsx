import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PostArticle } from "@/components/blog/post-article"
import { ViewTracker } from "@/components/blog/view-tracker"
import { getAdjacentPosts, getAllPostSlugs, getPostBySlug, getRelatedPosts } from "@/lib/queries/public"

export const revalidate = 300

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return (await getAllPostSlugs()).map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPostBySlug((await params).slug)
  if (!post) return {}
  const title = post.meta_title || post.title
  const description = post.meta_description || post.excerpt || undefined
  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      publishedTime: post.published_at ?? undefined,
      authors: post.author.full_name ? [post.author.full_name] : undefined,
      section: post.category?.name,
      tags: post.tags.map((t) => t.name),
    },
    twitter: { card: "summary_large_image", title, description },
  }
}

export default async function PostPage({ params }: Props) {
  const post = await getPostBySlug((await params).slug)
  if (!post) notFound()

  const [related, adjacent] = await Promise.all([getRelatedPosts(post, 3), getAdjacentPosts(post)])

  return (
    <>
      <ViewTracker slug={post.slug} />
      <PostArticle post={post} related={related} adjacent={adjacent} />
    </>
  )
}

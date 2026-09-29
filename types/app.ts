import type { Tables } from "@/types/database.types"

export type Author = Pick<Tables<"profiles">, "id" | "full_name" | "username" | "avatar_url" | "bio" | "role"> & {
  title?: string
}

export type Category = Pick<Tables<"categories">, "id" | "name" | "slug" | "description">
export type Tag = Pick<Tables<"tags">, "id" | "name" | "slug">

export type Post = Omit<Tables<"posts">, "search_vector" | "author_id" | "category_id" | "created_at" | "updated_at"> & {
  author: Author
  category: Category | null
  tags: Tag[]
}

/** Post fields needed by cards and lists (no body). */
export type PostSummary = Omit<Post, "content">

export type WithCount<T> = T & { postCount: number }

export type Paginated<T> = {
  items: T[]
  page: number
  totalPages: number
  total: number
}

export type ActionResult = { success: true; error?: never } | { success: false; error: string }

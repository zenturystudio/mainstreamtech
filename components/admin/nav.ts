import {
  FilePlus2,
  FileText,
  FileImage,
  FolderTree,
  Images,
  LayoutDashboard,
  Mail,
  Settings,
  Tags,
  UserCircle,
  Users,
  type LucideIcon,
} from "lucide-react"

export type AdminNavItem = { label: string; href: string; icon: LucideIcon; adminOnly?: boolean; exact?: boolean; /** Indented under the item above. */ sub?: boolean }

export const adminNav: { title?: string; items: AdminNavItem[] }[] = [
  {
    items: [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true }],
  },
  {
    title: "Content",
    items: [
      { label: "Posts", href: "/admin/posts", icon: FileText, exact: true },
      { label: "New post", href: "/admin/posts/new", icon: FilePlus2 },
      { label: "Categories", href: "/admin/categories", icon: FolderTree },
      { label: "Tags", href: "/admin/tags", icon: Tags },
      { label: "Media", href: "/admin/media", icon: Images, exact: true },
      { label: "Blog media", href: "/admin/media/blog", icon: FileImage, sub: true },
    ],
  },
  {
    title: "Audience",
    items: [{ label: "Subscribers", href: "/admin/subscribers", icon: Mail, adminOnly: true }],
  },
  {
    title: "Admin",
    items: [
      { label: "Users", href: "/admin/users", icon: Users, adminOnly: true },
      { label: "Settings", href: "/admin/settings", icon: Settings, adminOnly: true },
      { label: "Profile", href: "/admin/profile", icon: UserCircle },
    ],
  },
]

export function isNavActive(pathname: string, item: AdminNavItem) {
  if (item.exact) return pathname === item.href || (item.href === "/admin/posts" && /^\/admin\/posts\/[^/]+\/edit/.test(pathname))
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

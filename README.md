# Mainstream Tech

News site and newsroom CMS for [mainstreamtech.co.uk](https://www.mainstreamtech.co.uk), built with Next.js 15 (App Router) and Supabase.

- **Public site:** home (featured, trending, latest), story pages with contents, reading progress and sharing, plus section, tag and author pages, full-text search, About and Contact. It also has RSS, a sitemap and generated share images.
- **CMS (`/admin`):** dashboard, posts, a rich-text editor (Tiptap) with autosave, scheduling and preview, sections, tags, media library, subscribers with CSV export, users and roles, site settings, and profile.
- **Roles:** admins manage everything. Authors write and manage their own posts. Access is enforced in the database with row level security, not just in the UI.

## Stack

Next.js 15 · TypeScript · Tailwind CSS 4 · shadcn/ui · Supabase (Postgres, Auth, Storage, RLS) · Tiptap · react-hook-form + zod · Recharts

## Setup

1. **Install**

   ```bash
   npm install
   ```

2. **Create a Supabase project** and copy `.env.example` to `.env.local`:

   | Variable | Where to find it |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API Keys → publishable key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API Keys → secret key (server only, never expose it) |
   | `SUPABASE_DB_URL` | Connect → Session pooler (IPv4) connection string, used for migrations and types |
   | `NEXT_PUBLIC_SITE_URL` | Public site origin, e.g. `http://localhost:3003` |
   | `NEXT_PUBLIC_ADMIN_URL` | CMS origin in local dev, e.g. `http://localhost:3002` (leave empty in production) |

3. **Create the database.** Run the migrations in `supabase/migrations/` in order, either in the SQL Editor or with:

   ```bash
   npx supabase db push --db-url "$SUPABASE_DB_URL"
   ```

   This creates the tables, triggers, search, RLS policies and the `blog-images` storage bucket.

4. **Create your admin account.** In Supabase go to Authentication → Add user, then promote it in the SQL Editor:

   ```sql
   update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');
   ```

5. **Allow auth redirects.** Under Authentication → URL Configuration, add `http://localhost:3002/**` (and your production URL) to Redirect URLs, so magic links and invites work.

6. **(Optional) Load starter content:**

   ```bash
   npm run seed:content
   ```

## Running locally

The public site and the CMS run as two dev servers from the same app:

```bash
npm run dev        # public site → http://localhost:3003
npm run dev:admin  # CMS         → http://localhost:3002/admin
```

Each server redirects the other's routes to the right port. In production (one deployment, `NEXT_PUBLIC_ADMIN_URL` unset) both live on the same domain.

Other scripts:

| Script | What it does |
| --- | --- |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run db:types` | Regenerate `types/database.types.ts` from the live database |
| `npm run seed:content` | Load starter sections, tags and stories (safe to re-run) |

## Deploying to Vercel

1. Import the repository in Vercel.
2. Add the environment variables above. Set `NEXT_PUBLIC_SITE_URL` to your domain and leave `NEXT_PUBLIC_ADMIN_URL` empty.
3. Add your production URL to Supabase's Site URL and Redirect URLs.
4. Deploy. The CMS is at `/admin` on the same domain.

## Project structure

```
app/(public)     public pages (home, blog, category, tag, author, search, about, contact)
app/(auth)       login
app/admin        CMS
app/preview      draft preview
components/      ui (shadcn), blog, admin, shared
lib/actions      server actions (validated with zod)
lib/queries      data access (public: cookie-less and cacheable; admin: runs as the signed-in user)
lib/validations  zod schemas
supabase/        migrations and seed.sql
scripts/         seed-content (starter stories)
```

// Regenerates types/database.types.ts from the live database.
// Reads SUPABASE_DB_URL from .env.local so it works in any shell.
import { execSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"

const env = readFileSync(".env.local", "utf8")
const dbUrl = process.env.SUPABASE_DB_URL ?? env.match(/^SUPABASE_DB_URL=(.+)$/m)?.[1]?.trim()
if (!dbUrl) throw new Error("Set SUPABASE_DB_URL in .env.local")

const types = execSync(`npx supabase gen types typescript --db-url "${dbUrl}" --schema public`, { encoding: "utf8" })
writeFileSync("types/database.types.ts", types)
console.log("types/database.types.ts updated")

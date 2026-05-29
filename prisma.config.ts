import dotenv from 'dotenv'
import { defineConfig } from 'prisma/config'

// Load .env.local first (Next.js convention, real credentials)
// then fall back to .env (Prisma-generated default)
dotenv.config({ path: '.env.local' })
dotenv.config()

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Use DIRECT_URL for migrations (bypasses Supabase connection pooler)
    // Falls back to DATABASE_URL if DIRECT_URL is not set
    url: process.env['DIRECT_URL'] ?? process.env['DATABASE_URL'],
  },
})

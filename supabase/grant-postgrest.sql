-- Run in Supabase SQL Editor once.
-- Tables created via Prisma don't automatically get PostgREST role grants.
-- This lets the anon/authenticated roles read/write via the Supabase JS client
-- if you ever use supabase.from() in client components.

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

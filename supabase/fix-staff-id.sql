-- Run in Supabase SQL Editor if a staff user was created manually and their
-- User.id doesn't match the Supabase auth.users UUID.

-- Step 1: verify the mismatch
SELECT
  u.id        AS prisma_id,
  u.email,
  u.role,
  au.id       AS auth_id,
  u.id = au.id::text AS ids_match
FROM "User" u
JOIN auth.users au ON au.email = u.email
WHERE u.role IN ('STAFF', 'ADMIN');

-- Step 2: fix any rows where ids_match = false
-- (Uncomment and run only if Step 1 shows ids_match = false)
--
-- UPDATE "User"
-- SET id = au.id::text
-- FROM auth.users au
-- WHERE "User".email = au.email
--   AND "User".role IN ('STAFF', 'ADMIN')
--   AND "User".id <> au.id::text;

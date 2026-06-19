### ✅ Stage 8A — Admin Panel (COMPLETE)

- Admin dashboard `/admin`: 4 stat cards (Applications, Vendors, Payments, Events) + quick-link buttons to Event Setup and Manage Users
- User management `/admin/users`: full user list table with inline role-change dropdown, self-role-change protection, create staff/admin form (email + password + role)
- Admin Panel nav link in staff layout — visible only when `user.role === "ADMIN"`, visually distinct (rose colour + shield icon, separator above)
- New API routes:
  - `GET  /api/admin/users`             — list all users (returns `currentUserId` for self-guard in UI)
  - `POST /api/admin/users`             — create Supabase auth user + Prisma row (email_confirm: true)
  - `PATCH /api/admin/users/[id]/role`  — update role; rejects if target === current admin
- Admin layout nav verified/filled: Dashboard → `/admin`, Event Setup → `/admin/events`, Manage Users → `/admin/users`

**Commit message:**
```
feat: Stage 8A — admin dashboard, user management, role-conditional nav link
```

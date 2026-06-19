'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { ShieldCheck, User, Store, ChevronDown, Loader2 } from 'lucide-react'

type Role = 'VENDOR' | 'STAFF' | 'ADMIN'

interface UserRow {
  id: string
  email: string
  role: Role
  createdAt: string
}

const roleBadgeClass: Record<Role, string> = {
  ADMIN: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  STAFF: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  VENDOR: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
}

function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${roleBadgeClass[role]}`}
    >
      {role === 'ADMIN' && <ShieldCheck className="h-3 w-3" />}
      {role === 'STAFF' && <User className="h-3 w-3" />}
      {role === 'VENDOR' && <Store className="h-3 w-3" />}
      {role}
    </span>
  )
}

function UserTableRow({
  user,
  currentUserId,
  onRoleChange,
}: {
  user: UserRow
  currentUserId: string
  onRoleChange: (id: string, newRole: Role) => Promise<void>
}) {
  const [pending, startTransition] = useTransition()
  const isSelf = user.id === currentUserId

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newRole = e.target.value as Role
    startTransition(() => {
      onRoleChange(user.id, newRole)
    })
  }

  return (
    <tr className="border-b border-border hover:bg-accent/40 transition-colors">
      <td className="px-4 py-3 text-sm text-foreground">{user.email}</td>
      <td className="px-4 py-3">
        <RoleBadge role={user.role} />
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {new Date(user.createdAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <div className="relative inline-flex items-center">
          <select
            defaultValue={user.role}
            disabled={isSelf || pending}
            onChange={handleChange}
            className="appearance-none text-sm border border-border rounded-md px-2.5 py-1.5 pr-7 bg-background text-foreground disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="VENDOR">VENDOR</option>
            <option value="STAFF">STAFF</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          {pending ? (
            <Loader2 className="absolute right-2 h-3.5 w-3.5 animate-spin text-muted-foreground pointer-events-none" />
          ) : (
            <ChevronDown className="absolute right-2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          )}
        </div>
        {isSelf && (
          <span className="ml-2 text-xs text-muted-foreground">(you)</span>
        )}
      </td>
      <td className="px-4 py-3">
        {user.role === 'VENDOR' && (
          <Link
            href={`/admin/users/${user.id}`}
            className="text-xs text-primary hover:underline"
          >
            Activity
          </Link>
        )}
      </td>
    </tr>
  )
}

function CreateStaffForm({ onCreated }: { onCreated: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'STAFF' | 'ADMIN'>('STAFF')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit() {
    setError(null)
    setSuccess(null)

    if (!email || !password) {
      setError('Email and password are required.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, role }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to create user.')
        setSuccess(`Account created for ${data.email}.`)
        setEmail('')
        setPassword('')
        setRole('STAFF')
        onCreated()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unexpected error.')
      }
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-base font-semibold text-foreground mb-4">
        Create staff account
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="staff@example.com"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Temporary password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 8 characters"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'STAFF' | 'ADMIN')}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="STAFF">STAFF</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-destructive mb-3">{error}</p>}
      {success && (
        <p className="text-sm text-green-600 dark:text-green-400 mb-3">{success}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Create account
      </button>
    </div>
  )
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string>('')

  async function fetchUsers() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      setUsers(data.users ?? [])
      setCurrentUserId(data.currentUserId ?? '')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  async function handleRoleChange(id: string, newRole: Role) {
    await fetch(`/api/admin/users/${id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    })
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, role: newRole } : u))
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Manage users</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Change roles or create new staff accounts.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Email
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Role
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Created
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Change role
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Activity
              </th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <UserTableRow
                  key={u.id}
                  user={u}
                  currentUserId={currentUserId}
                  onRoleChange={handleRoleChange}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <CreateStaffForm onCreated={fetchUsers} />
    </div>
  )
}

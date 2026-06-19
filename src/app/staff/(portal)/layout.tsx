import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { signOut } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { ShieldCheck, ClipboardCheck } from 'lucide-react'

const navLinks = [
  { href: '/staff/queue', label: 'Review queue' },
  { href: '/staff/booths', label: 'Booth map' },
  { href: '/staff/invoices', label: 'Invoices' },
  { href: '/staff/vendors', label: 'Vendors' },
  { href: '/admin/events', label: 'Event setup' },
]

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  })

  if (!dbUser || dbUser.role === 'VENDOR') redirect('/vendor/dashboard')

  const isAdmin = dbUser.role === 'ADMIN'

  return (
    <div className="min-h-screen bg-background" data-surface="clean">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-900">VendorHub</span>
            <span className="text-slate-300">|</span>
            <span className="text-sm text-slate-500">Staff Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">{user.email}</span>
            <form action={signOut}>
              <Button
                variant="ghost"
                size="sm"
                type="submit"
                className="text-slate-500 text-xs"
              >
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 flex gap-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="px-3 py-3 text-sm text-slate-500 hover:text-slate-900 border-b-2 border-transparent hover:border-slate-300 transition-colors"
            >
              {label}
            </Link>
          ))}
          <Link
            href="/staff/checkin"
            className="flex items-center gap-1.5 px-3 py-3 text-sm text-slate-500 hover:text-slate-900 border-b-2 border-transparent hover:border-slate-300 transition-colors"
          >
            <ClipboardCheck className="h-3.5 w-3.5 shrink-0" />
            Check-In
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="ml-auto flex items-center gap-1.5 px-3 py-3 text-sm font-medium text-rose-600 hover:text-rose-800 border-b-2 border-transparent hover:border-rose-300 transition-colors"
            >
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              Admin Panel
            </Link>
          )}
        </div>
      </nav>

      <main className="p-6">{children}</main>
    </div>
  )
}

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'

const navLinks = [
  { href: '/staff/queue', label: 'Review queue' },
  { href: '/staff/booths', label: 'Booth map' },
  { href: '/staff/invoices', label: 'Invoices' },
  { href: '/staff/messages', label: 'Messages' },
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

  const role = user.user_metadata?.role
  if (role === 'VENDOR') redirect('/vendor/dashboard')

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 h-14 flex items-center justify-between">
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
      </header>

      <nav className="bg-white border-b border-slate-100 px-6">
        <div className="flex gap-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="px-3 py-3 text-sm text-slate-500 hover:text-slate-900 border-b-2 border-transparent hover:border-slate-300 transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      </nav>

      <main className="p-6">{children}</main>
    </div>
  )
}

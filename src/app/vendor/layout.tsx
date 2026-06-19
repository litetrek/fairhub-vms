import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { signOut } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'

const navLinks = [
  { href: '/vendor/dashboard', label: 'Dashboard' },
  { href: '/vendor/applications', label: 'Applications' },
  { href: '/vendor/documents', label: 'Documents' },
  { href: '/vendor/invoices', label: 'Invoices' },
  { href: '/vendor/profile', label: 'Profile' },
]

export default async function VendorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Profile completeness guard — skip if already on the setup page
  const headersList = await headers()
  const pathname = headersList.get('x-invoke-path') ?? headersList.get('x-pathname') ?? ''
  const isOnSetupPage = pathname.startsWith('/vendor/profile/complete')

  if (!isOnSetupPage) {
    const [vendorProfile, dbUser] = await Promise.all([
      prisma.vendorProfile.findUnique({
        where: { userId: user.id },
        select: { businessName: true, contactName: true, description: true },
      }),
      prisma.user.findUnique({
        where: { id: user.id },
        select: { phone: true },
      }),
    ])

    const isIncomplete =
      !vendorProfile ||
      !vendorProfile.businessName?.trim() ||
      !vendorProfile.contactName?.trim() ||
      !dbUser?.phone?.trim() ||
      !vendorProfile.description?.trim()

    if (isIncomplete) {
      redirect('/vendor/profile/complete?setup=true')
    }
  }

  const businessName = user.user_metadata?.businessName || 'My Business'
  const initials = businessName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="min-h-screen bg-background" data-surface="festive">
      <header className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/images/glowfest-logo.png"
              alt="GLOWFEST"
              height={32}
              width={120}
              className="object-contain"
            />
            <span className="text-border">|</span>
            <span className="text-sm text-muted-foreground">Vendor Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                {initials}
              </div>
              <span className="text-sm text-muted-foreground">{businessName}</span>
            </div>
            <form action={signOut}>
              <Button
                variant="ghost"
                size="sm"
                type="submit"
                className="text-muted-foreground text-xs"
              >
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <nav className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-6 flex gap-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="px-3 py-3 text-sm text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-primary transition-colors"
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

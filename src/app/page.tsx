import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveTheme } from '@/themes'
import { Button } from '@/components/ui/button'

const steps = [
  {
    number: '01',
    title: 'Register',
    description: 'Create a free vendor account with your business name and contact details.',
  },
  {
    number: '02',
    title: 'Submit application',
    description: 'Choose your booth type, select your event weeks, and submit for review.',
  },
  {
    number: '03',
    title: 'Upload documents',
    description: 'Provide required permits, liability insurance, and any certifications.',
  },
  {
    number: '04',
    title: 'Get approved',
    description: 'Our team reviews every application and notifies you of your status.',
  },
  {
    number: '05',
    title: 'Pay your invoice',
    description: 'Once approved, pay your booth fee securely through the vendor portal.',
  },
  {
    number: '06',
    title: 'Check in at the event',
    description: 'Arrive at your assigned booth location and light up the night.',
  },
]

export default async function Home() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { resolvePostLoginPath } = await import('@/lib/auth-redirect')
      const result = await resolvePostLoginPath(user.id)
      if ('path' in result) redirect(result.path)
    }
  } catch {
    // Supabase not configured — fall through to landing page
  }

  const theme = getActiveTheme()
  const currentYear = new Date().getFullYear()

  return (
    <div data-surface="festive" className="min-h-screen bg-background text-foreground">

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col">

        {/* Background image + overlay */}
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <Image
            src={theme.heroImagePath}
            alt=""
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-b from-black/65 via-black/35 to-black/90" />
        </div>

        {/* Logo bar */}
        <header className="relative z-10 px-6 pt-6 sm:px-10 sm:pt-8">
          <Image
            src={theme.logoPath}
            alt={theme.displayName}
            height={40}
            width={150}
            className="object-contain"
          />
        </header>

        {/* Hero content */}
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 text-center px-6 pb-24 sm:px-10">

          {/* Subtle radial glow behind headline */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 55% 35% at 50% 52%, oklch(0.52 0.27 340 / 0.11) 0%, transparent 70%)',
            }}
          />

          <h1
            className="relative text-4xl sm:text-6xl lg:text-7xl font-black leading-tight tracking-tight text-foreground mb-6 max-w-4xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Bring your light to<br className="hidden sm:block" />{' '}
            {theme.displayName}
          </h1>

          <p className="relative text-lg sm:text-xl text-muted-foreground max-w-xl mb-10 leading-relaxed">
            Vendor applications are open for the {currentYear} season. Secure
            your booth and become part of the most spectacular night market in
            the region.
          </p>

          <div className="relative flex flex-col sm:flex-row items-center gap-4">
            <Button
              asChild
              size="lg"
              className="glow-primary px-8 text-base font-semibold"
            >
              <Link href="/auth/register">Apply for a Booth</Link>
            </Button>
            <Link
              href="/auth/login"
              className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
            >
              Already applied? Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="px-6 py-20 sm:px-10">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-3xl sm:text-4xl font-bold text-center text-foreground mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            How it works
          </h2>
          <p className="text-center text-muted-foreground mb-14 max-w-lg mx-auto">
            From first click to opening night — here&apos;s what the vendor
            journey looks like.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {steps.map((step) => (
              <div
                key={step.number}
                className="bg-card border border-border rounded-xl p-6 flex flex-col gap-3"
              >
                <span
                  className="text-3xl font-black leading-none text-primary"
                  style={{ fontFamily: 'var(--font-display)' }}
                  aria-hidden="true"
                >
                  {step.number}
                </span>
                <h3 className="text-base font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section className="px-6 py-16 sm:px-10 border-t border-border text-center">
        <div className="max-w-xl mx-auto">
          <h2
            className="text-2xl sm:text-3xl font-bold text-foreground mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Ready to glow?
          </h2>
          <p className="text-muted-foreground mb-8">
            Booth spots fill quickly. Apply today and claim your place at{' '}
            {theme.displayName} {currentYear}.
          </p>
          <Button
            asChild
            size="lg"
            className="glow-primary px-8 text-base font-semibold"
          >
            <Link href="/auth/register">Apply for a Booth</Link>
          </Button>
        </div>
      </section>

    </div>
  )
}

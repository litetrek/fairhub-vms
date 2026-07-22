import Image from 'next/image'
import Link from 'next/link'
import { getActiveTheme } from '@/themes'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const theme = getActiveTheme()

  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center p-4" data-surface="festive">
      <Link
        href="/"
        className="absolute top-6 left-6 sm:top-8 sm:left-10 z-10"
        aria-label={`${theme.displayName} home`}
      >
        <Image
          src={theme.logoPath}
          alt={theme.displayName}
          height={40}
          width={150}
          className="object-contain"
          priority
        />
      </Link>
      {children}
    </div>
  )
}

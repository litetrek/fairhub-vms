import type { Metadata } from 'next'
import { Inter, Cinzel } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { getActiveTheme } from '@/themes'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '700', '900'],
})

const theme = getActiveTheme()

export const metadata: Metadata = {
  title: `${theme.displayName} — Vendor Portal`,
  description: 'Annual fair vendor and exhibitor management platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-theme={theme.id}
      className={`${inter.variable} ${cinzel.variable}`}
    >
      <body>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}

import { type Theme } from './types'
import { glowfestTheme } from './glowfest'

const registry: Record<string, Theme> = {
  glowfest: glowfestTheme,
}

export function getActiveTheme(): Theme {
  const org = process.env.NEXT_PUBLIC_ORG ?? 'glowfest'
  return registry[org] ?? glowfestTheme
}

export { type Theme }

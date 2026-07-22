import { redirect } from 'next/navigation'

export default async function StaffLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const qs = params.error ? `?error=${encodeURIComponent(params.error)}` : ''
  redirect(`/auth/login${qs}`)
}

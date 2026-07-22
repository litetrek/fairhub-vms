import VerifyEmailClient from './VerifyEmailClient'

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const params = await searchParams
  return <VerifyEmailClient email={params.email ?? ''} />
}

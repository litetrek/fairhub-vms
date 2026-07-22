import VerifyEmailClient from './VerifyEmailClient'

<<<<<<< HEAD
export default function VerifyEmailPage() {
  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-medium text-slate-900">VendorHub</h1>
        <p className="text-slate-500 mt-1 text-sm">Annual Vendor &amp; Exhibitor Portal</p>
      </div>

      <Card className="border-slate-200 shadow-sm text-center">
        <CardHeader className="pb-4">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
              className="text-slate-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
          </div>
          <CardTitle className="text-xl font-medium">Check your email</CardTitle>
          <CardDescription>
            We sent a verification link to your email address. Click the link
            to activate your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-500">
            Didn&apos;t receive it? Check your spam folder or{' '}
            <span className="text-slate-900 font-medium cursor-pointer">
              resend the email
            </span>
          </p>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/auth/login">Back to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
=======
export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const params = await searchParams
  return <VerifyEmailClient email={params.email ?? ''} />
>>>>>>> e57e9d03c27e71b25f01385befd76405419c5cb3
}

import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

const ACTION_LABELS: Record<string, string> = {
  APPLICATION_CREATED:          'Application created',
  APPLICATION_SUBMITTED:        'Application submitted',
  APPLICATION_RESUBMITTED:      'Application resubmitted',
  APPLICATION_WITHDRAWN:        'Application withdrawn',
  APPLICATION_DELETED:          'Application deleted',
  DOCUMENT_UPLOADED:            'Document uploaded',
  DOCUMENT_REUSED:              'Document reused from prior application',
  DOCUMENT_DELETED:             'Document deleted',
  STANDALONE_DOCUMENT_UPLOADED: 'Document uploaded (standalone)',
  STANDALONE_DOCUMENT_DELETED:  'Document deleted (standalone)',
  LOGIN:                        'Vendor logged in',
  LOGOUT:                       'Vendor logged out',
  PROFILE_UPDATED:              'Profile updated',
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const currentUser = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { role: true },
  })
  if (!currentUser || currentUser.role !== 'ADMIN') redirect('/staff/queue')

  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      vendorProfile: {
        include: {
          activityLogs: {
            orderBy: { createdAt: 'desc' },
            take: 200,
            select: {
              id: true,
              action: true,
              detail: true,
              applicationId: true,
              ipAddress: true,
              createdAt: true,
            },
          },
        },
      },
    },
  })

  if (!user) notFound()

  const logs = user.vendorProfile?.activityLogs ?? []

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-4">
        <Link
          href="/admin/users"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Users
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{user.email}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Role: {user.role} · Joined {new Date(user.createdAt).toLocaleDateString()}
        </p>
      </div>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="font-semibold mb-4 text-foreground">
          Activity log ({logs.length} entries)
        </h2>
        {logs.length === 0 ? (
          <p className="text-muted-foreground text-sm">No activity recorded.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {logs.map((log) => (
              <div key={log.id} className="py-2.5 flex justify-between text-sm">
                <div>
                  <span className="font-medium text-foreground">
                    {ACTION_LABELS[log.action] ?? log.action}
                  </span>
                  {log.detail && (
                    <span className="text-muted-foreground ml-2">— {log.detail}</span>
                  )}
                  {log.applicationId && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (App: {log.applicationId.slice(0, 8)}…)
                    </span>
                  )}
                </div>
                <div className="text-right text-muted-foreground text-xs shrink-0 ml-4">
                  <div>{new Date(log.createdAt).toLocaleString()}</div>
                  {log.ipAddress && <div>{log.ipAddress}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import {
  ClipboardList,
  Store,
  CreditCard,
  CalendarDays,
  ExternalLink,
} from 'lucide-react'

async function getDashboardStats() {
  const [
    totalApplications,
    applicationsByStatus,
    totalVendors,
    paymentsAgg,
    unpaidInvoices,
    totalEvents,
    openEvents,
  ] = await Promise.all([
    prisma.application.count(),
    prisma.application.groupBy({
      by: ['status'],
      _count: { status: true },
    }),
    prisma.vendorProfile.count(),
    prisma.payment.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
    }),
    prisma.invoice.count({
      where: { status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] } },
    }),
    prisma.event.count(),
    prisma.event.count({ where: { status: 'OPEN' } }),
  ])

  const statusMap = Object.fromEntries(
    applicationsByStatus.map((g) => [g.status, g._count.status])
  )

  return {
    applications: {
      total: totalApplications,
      submitted: statusMap['SUBMITTED'] ?? 0,
      underReview: statusMap['UNDER_REVIEW'] ?? 0,
      approved: statusMap['APPROVED'] ?? 0,
      rejected: statusMap['REJECTED'] ?? 0,
    },
    vendors: { total: totalVendors },
    payments: {
      totalCollected: Number(paymentsAgg._sum.amount ?? 0),
      unpaidInvoices,
    },
    events: { total: totalEvents, open: openEvents },
  }
}

function StatRow({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium tabular-nums">{value}</span>
    </div>
  )
}

function StatCard({
  title,
  icon: Icon,
  headline,
  children,
}: {
  title: string
  icon: React.ElementType
  headline: string | number
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="text-3xl font-semibold tabular-nums text-foreground leading-none">
        {headline}
      </p>
      <div className="divide-y divide-border">{children}</div>
    </div>
  )
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  })

  if (!dbUser || dbUser.role !== 'ADMIN') redirect('/staff/queue')

  const stats = await getDashboardStats()

  const currencyFmt = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  })

  return (
    <div className="p-8 max-w-5xl mx-auto" data-surface="clean">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">System-wide overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <StatCard
          title="Applications"
          icon={ClipboardList}
          headline={stats.applications.total}
        >
          <StatRow label="Submitted" value={stats.applications.submitted} />
          <StatRow label="Under Review" value={stats.applications.underReview} />
          <StatRow label="Approved" value={stats.applications.approved} />
          <StatRow label="Rejected" value={stats.applications.rejected} />
        </StatCard>

        <StatCard title="Vendors" icon={Store} headline={stats.vendors.total}>
          <StatRow label="Vendor profiles" value={stats.vendors.total} />
        </StatCard>

        <StatCard
          title="Payments"
          icon={CreditCard}
          headline={currencyFmt.format(stats.payments.totalCollected)}
        >
          <StatRow
            label="Total collected"
            value={currencyFmt.format(stats.payments.totalCollected)}
          />
          <StatRow label="Unpaid invoices" value={stats.payments.unpaidInvoices} />
        </StatCard>

        <StatCard title="Events" icon={CalendarDays} headline={stats.events.total}>
          <StatRow label="Total events" value={stats.events.total} />
          <StatRow label="Currently open" value={stats.events.open} />
        </StatCard>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/events"
          className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          Event Setup
        </Link>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          Manage Users
        </Link>
      </div>
    </div>
  )
}

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

const DOC_TYPE_LABELS: Record<string, string> = {
  BUSINESS_LICENSE: 'Business License',
  SELLERS_PERMIT: "Seller's Permit",
  HEALTH_PERMIT: 'Health Permit',
  FOOD_HANDLER: 'Food Handler Certificate',
  INSURANCE: 'Insurance Certificate',
  OTHER: 'Other Document',
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function formatDateRange(start: Date, end: Date) {
  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    return `${start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}–${end.getDate()}, ${end.getFullYear()}`
  }
  return `${formatDate(start)} – ${formatDate(end)}`
}

export default async function PublicFairPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const event = await prisma.event.findFirst({
    where: { publicSlug: slug, status: 'OPEN' },
    include: {
      boothTypes: {
        orderBy: { sortOrder: 'asc' },
        include: {
          docRequirements: { where: { required: true } },
          addOns: { orderBy: { sortOrder: 'asc' } },
        },
      },
      addOns: { orderBy: { sortOrder: 'asc' } },
    },
  })

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md px-6">
          <p className="text-2xl font-medium text-slate-300 mb-3">404</p>
          <h1 className="text-lg font-medium text-slate-700 mb-2">This event page isn&apos;t available</h1>
          <p className="text-sm text-slate-400">
            The event you&apos;re looking for may have ended or the link may be incorrect.
          </p>
        </div>
      </div>
    )
  }

  // Determine logged-in user role for CTA
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let userRole: string | null = null
  if (user) {
    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
    userRole = dbUser?.role ?? null
  }

  const vendorApplyUrl = `/vendor/applications/new?eventId=${event.id}`
  const ctaHref = !userRole
    ? `/auth/login?redirect=${encodeURIComponent(vendorApplyUrl)}`
    : userRole === 'VENDOR'
    ? vendorApplyUrl
    : null

  return (
    <div className="min-h-screen bg-white">
      {/* ── Banner ─────────────────────────────────────────────────────────── */}
      <section className="relative">
        {event.bannerImageUrl ? (
          <div className="relative h-64 md:h-80 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.bannerImageUrl}
              alt={event.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 flex items-end">
              <div className="p-8 text-white">
                <h1 className="text-3xl md:text-4xl font-bold mb-1">{event.name}</h1>
                <p className="text-white/80 text-sm md:text-base">
                  {formatDateRange(event.eventDateStart, event.eventDateEnd)}
                  {event.hours && ` · ${event.hours}`}
                  {event.location && ` · ${event.location}`}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 px-6 py-16 md:py-24 text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">{event.name}</h1>
            <p className="text-slate-300 text-sm md:text-base">
              {formatDateRange(event.eventDateStart, event.eventDateEnd)}
              {event.hours && ` · ${event.hours}`}
              {event.location && ` · ${event.location}`}
            </p>
          </div>
        )}
      </section>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-12">
        {/* ── Event info ─────────────────────────────────────────────────── */}
        {(event.description || event.address || event.applicationDeadline) && (
          <section className="space-y-3">
            {event.description && (
              <p className="text-slate-600 leading-relaxed">{event.description}</p>
            )}
            {(event.address || event.city) && (
              <p className="text-sm text-slate-500">
                📍 {[event.address, event.city, event.state].filter(Boolean).join(', ')}
              </p>
            )}
            {event.applicationDeadline && (
              <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2">
                <span className="text-amber-700 font-medium text-sm">
                  Application deadline: {formatDate(event.applicationDeadline)}
                </span>
              </div>
            )}
          </section>
        )}

        {/* ── Map ────────────────────────────────────────────────────────── */}
        {event.mapEmbedUrl && (
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Location</h2>
            <iframe
              title="Event location map"
              src={event.mapEmbedUrl}
              width="100%"
              height="300"
              className="rounded-xl border border-slate-200"
              sandbox="allow-scripts allow-same-origin"
              loading="lazy"
            />
          </section>
        )}

        {/* ── Booth Types ────────────────────────────────────────────────── */}
        {event.boothTypes.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Available booths</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {event.boothTypes.map((bt) => {
                // Add-ons available for this booth type: those targeting this BT OR available to all (boothTypeId null)
                const boothTypeAddOns = event.addOns.filter(
                  (ao) => ao.boothTypeId === bt.id || ao.boothTypeId === null
                )
                return (
                  <div
                    key={bt.id}
                    className="border border-slate-200 rounded-xl p-6 flex flex-col gap-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-slate-900 text-lg">{bt.name}</h3>
                        <div className="text-right shrink-0">
                          <p className="text-xl font-bold text-slate-900">${Number(bt.basePrice).toFixed(2)}</p>
                          {bt.sizeSqft && <p className="text-xs text-slate-400">{bt.sizeSqft} sqft</p>}
                        </div>
                      </div>
                      {bt.description && (
                        <p className="text-sm text-slate-500 mt-1">{bt.description}</p>
                      )}
                    </div>

                    {bt.whatsIncluded && (
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">What&apos;s included</p>
                        <p className="text-sm text-slate-600 whitespace-pre-line">{bt.whatsIncluded}</p>
                      </div>
                    )}

                    {boothTypeAddOns.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Available add-ons</p>
                        <div className="space-y-1">
                          {boothTypeAddOns.map((ao) => (
                            <div key={ao.id} className="flex items-center justify-between text-sm">
                              <span className="text-slate-700">{ao.name}</span>
                              <span className="text-slate-500 font-medium">+${Number(ao.price).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {bt.docRequirements.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Required documents</p>
                        <div className="space-y-1">
                          {bt.docRequirements.map((dr) => (
                            <div key={dr.id} className="flex items-center gap-1.5 text-sm text-slate-600">
                              <span className="text-slate-400">·</span>
                              {DOC_TYPE_LABELS[dr.docType] ?? dr.docType}
                              {dr.notes && <span className="text-xs text-slate-400">({dr.notes})</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Per-card CTA */}
                    <div className="mt-auto pt-2">
                      {ctaHref ? (
                        <Link
                          href={ctaHref}
                          className="block w-full text-center bg-slate-900 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-slate-700 transition-colors"
                        >
                          Request a booth
                        </Link>
                      ) : (
                        <p className="text-xs text-slate-400 text-center">Log in as a vendor to apply</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── All add-ons summary ─────────────────────────────────────────── */}
        {event.addOns.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Add-ons &amp; extras</h2>
            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100">
              {event.addOns.map((ao) => (
                <div key={ao.id} className="px-5 py-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-900">{ao.name}</p>
                    {ao.description && <p className="text-sm text-slate-500 mt-0.5">{ao.description}</p>}
                  </div>
                  <p className="text-slate-900 font-semibold shrink-0">${Number(ao.price).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── Floating CTA ────────────────────────────────────────────────────── */}
      {ctaHref && (
        <div className="fixed bottom-6 right-6 z-50">
          <Link
            href={ctaHref}
            className="flex items-center gap-2 bg-slate-900 text-white text-sm font-semibold px-5 py-3 rounded-full shadow-lg hover:bg-slate-700 transition-colors"
          >
            Request a booth ↗
          </Link>
        </div>
      )}
    </div>
  )
}

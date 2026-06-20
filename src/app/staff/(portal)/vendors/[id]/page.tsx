import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const statusColors: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  SUBMITTED: 'bg-blue-50 text-blue-700',
  UNDER_REVIEW: 'bg-yellow-50 text-yellow-700',
  CONDITIONALLY_APPROVED: 'bg-purple-50 text-purple-700',
  APPROVED: 'bg-green-50 text-green-700',
  REJECTED: 'bg-red-50 text-red-700',
  WITHDRAWN: 'bg-slate-100 text-slate-500',
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under review',
  CONDITIONALLY_APPROVED: 'Cond. approved',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
}

function toAbsoluteUrl(s: string) {
  if (!s) return null
  return s.startsWith('http') ? s : `https://${s}`
}

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default async function StaffVendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const vendor = await prisma.vendorProfile.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, phone: true, createdAt: true } },
      applications: {
        select: {
          id: true,
          status: true,
          createdAt: true,
          submittedAt: true,
          event: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!vendor) notFound()

  const totalApps = vendor.applications.length
  const approvedApps = vendor.applications.filter((a) => a.status === 'APPROVED').length

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back link */}
      <Button variant="ghost" size="sm" className="text-xs -ml-2" asChild>
        <Link href="/staff/vendors">← Vendor Directory</Link>
      </Button>

      {/* Banner + logo header */}
      <div className="rounded-lg overflow-hidden border border-slate-200">
        <div className="relative h-48">
          {vendor.bannerImageUrl ? (
            <img
              src={vendor.bannerImageUrl}
              alt="Banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-linear-to-r from-slate-700 to-slate-800" />
          )}
          {/* Logo */}
          <div className="absolute bottom-0 left-6 translate-y-1/2">
            {vendor.logoUrl ? (
              <img
                src={vendor.logoUrl}
                alt={vendor.businessName}
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white border-4 border-white shadow flex items-center justify-center text-lg font-semibold text-slate-600">
                {initials(vendor.businessName)}
              </div>
            )}
          </div>
        </div>
        <div className="bg-white px-6 pt-14 pb-4 flex items-center gap-3">
          <h1 className="text-xl font-semibold text-slate-900">{vendor.businessName}</h1>
          {vendor.businessType && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
              {vendor.businessType}
            </span>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left column */}
        <div className="col-span-2 space-y-6">
          {/* About */}
          {vendor.description && (
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{vendor.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Contact & Location */}
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Contact & Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-slate-700">
              <p><span className="text-slate-400 text-xs">Contact</span><br />{vendor.contactName}</p>
              {vendor.user.phone && (
                <p><span className="text-slate-400 text-xs">Phone</span><br />{vendor.user.phone}</p>
              )}
              <p><span className="text-slate-400 text-xs">Email</span><br />
                <a href={`mailto:${vendor.user.email}`} className="text-blue-600 hover:underline">
                  {vendor.user.email}
                </a>
              </p>
              {(vendor.address || vendor.city) && (
                <p>
                  <span className="text-slate-400 text-xs">Address</span><br />
                  {[vendor.address, vendor.city, vendor.state, vendor.zip].filter(Boolean).join(', ')}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Online Presence */}
          {(vendor.website || vendor.instagramUrl || vendor.facebookUrl || vendor.tiktokUrl) && (
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Online Presence</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {vendor.website && (
                  <div>
                    <span className="text-slate-400 text-xs">Website</span><br />
                    <a href={toAbsoluteUrl(vendor.website) ?? '#'} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                      {vendor.website}
                    </a>
                  </div>
                )}
                {vendor.instagramUrl && (
                  <div>
                    <span className="text-slate-400 text-xs">Instagram</span><br />
                    <a href={toAbsoluteUrl(vendor.instagramUrl) ?? '#'} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                      {vendor.instagramUrl}
                    </a>
                  </div>
                )}
                {vendor.facebookUrl && (
                  <div>
                    <span className="text-slate-400 text-xs">Facebook</span><br />
                    <a href={toAbsoluteUrl(vendor.facebookUrl) ?? '#'} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                      {vendor.facebookUrl}
                    </a>
                  </div>
                )}
                {vendor.tiktokUrl && (
                  <div>
                    <span className="text-slate-400 text-xs">TikTok</span><br />
                    <a href={toAbsoluteUrl(vendor.tiktokUrl) ?? '#'} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                      {vendor.tiktokUrl}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Product Photos */}
          {vendor.galleryImages && vendor.galleryImages.length > 0 && (
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Product Photos ({vendor.galleryImages.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {vendor.galleryImages.map((url, i) => (
                    <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                      className="block aspect-square rounded-lg overflow-hidden border border-slate-200 hover:opacity-80 transition-opacity">
                      <img src={url} alt={`Product ${i + 1}`} className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Feature Photo (full width, if not already shown in header) */}
          {vendor.bannerImageUrl && (
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Feature Photo</CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-hidden rounded-b-lg">
                <a href={vendor.bannerImageUrl} target="_blank" rel="noopener noreferrer">
                  <img src={vendor.bannerImageUrl} alt="Feature photo"
                    className="w-full max-h-64 object-cover hover:opacity-90 transition-opacity" />
                </a>
              </CardContent>
            </Card>
          )}

          {/* Applications */}
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Applications at This Fair</CardTitle>
            </CardHeader>
            <CardContent>
              {vendor.applications.length === 0 ? (
                <p className="text-sm text-slate-400">No applications</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left text-xs font-medium text-slate-400 pb-2">Event</th>
                      <th className="text-left text-xs font-medium text-slate-400 pb-2">Status</th>
                      <th className="text-left text-xs font-medium text-slate-400 pb-2">Submitted</th>
                      <th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vendor.applications.map((app) => (
                      <tr key={app.id}>
                        <td className="py-2 text-slate-700">{app.event.name}</td>
                        <td className="py-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[app.status] ?? 'bg-slate-100 text-slate-600'}`}>
                            {statusLabels[app.status] ?? app.status}
                          </span>
                        </td>
                        <td className="py-2 text-slate-500 text-xs">
                          {app.submittedAt
                            ? new Date(app.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : '—'}
                        </td>
                        <td className="py-2 text-right">
                          <Link href={`/staff/applications/${app.id}`} className="text-xs text-blue-600 hover:underline">
                            View →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="col-span-1 space-y-6">
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Business Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-slate-400">Business Type</p>
                <p className="text-slate-700">{vendor.businessType || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Years in Business</p>
                <p className="text-slate-700">{vendor.yearsInBusiness ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Tax ID</p>
                <p className="text-slate-700">{vendor.taxId || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Member since</p>
                <p className="text-slate-700">
                  {new Date(vendor.user.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-slate-400">Total applications</p>
                <p className="text-2xl font-semibold text-slate-900">{totalApps}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Approved</p>
                <p className="text-2xl font-semibold text-green-600">{approvedApps}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

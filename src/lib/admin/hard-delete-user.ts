import { prisma } from '@/lib/prisma'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function storagePathFromPublicUrl(url: string | null | undefined): string | null {
  if (!url) return null
  // Stored as storage path already
  if (!url.startsWith('http')) return url
  // Public URL: .../storage/v1/object/public/<bucket>/<path>
  const marker = '/object/public/'
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  const rest = url.slice(idx + marker.length)
  const slash = rest.indexOf('/')
  if (slash === -1) return null
  return rest.slice(slash + 1)
}

/**
 * Permanently erase a user and all related Prisma data, then remove
 * Supabase Auth + best-effort storage files.
 */
export async function hardDeleteUser(userId: string, actingAdminId: string) {
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      vendorProfile: {
        select: {
          id: true,
          logoUrl: true,
          bannerImageUrl: true,
          galleryImages: true,
        },
      },
    },
  })

  if (!target) {
    return { error: 'User not found.', status: 404 as const }
  }

  if (target.id === actingAdminId) {
    return { error: 'You cannot delete your own account.', status: 403 as const }
  }

  if (target.role === 'ADMIN') {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } })
    if (adminCount <= 1) {
      return {
        error: 'Cannot delete the last admin account.',
        status: 409 as const,
      }
    }
  }

  const mediaPaths: string[] = []
  const documentPaths: string[] = []

  if (target.vendorProfile) {
    const profile = target.vendorProfile
    for (const url of [
      profile.logoUrl,
      profile.bannerImageUrl,
      ...profile.galleryImages,
    ]) {
      const path = storagePathFromPublicUrl(url)
      if (path) mediaPaths.push(path)
    }

    const docs = await prisma.document.findMany({
      where: { vendorId: profile.id },
      select: { fileUrl: true },
    })
    for (const doc of docs) {
      if (doc.fileUrl) documentPaths.push(doc.fileUrl)
    }
  }

  await prisma.$transaction(async (tx) => {
    // Soft-detach optional references from this user acting as staff
    await tx.document.updateMany({
      where: { reviewedById: userId },
      data: { reviewedById: null },
    })
    await tx.boothAssignment.updateMany({
      where: { checkedInById: userId },
      data: { checkedInById: null },
    })
    await tx.payment.updateMany({
      where: { recordedById: userId },
      data: { recordedById: null },
    })
    await tx.message.updateMany({
      where: { sentById: userId },
      data: { sentById: null },
    })

    // Required FK: keep other vendors' booth assignments, reassign auditor
    await tx.boothAssignment.updateMany({
      where: { assignedById: userId },
      data: { assignedById: actingAdminId },
    })

    // Required FK: remove this user's approval actions
    await tx.approvalLog.deleteMany({ where: { reviewedById: userId } })

    if (target.vendorProfile) {
      const vendorId = target.vendorProfile.id

      const applications = await tx.application.findMany({
        where: { vendorId },
        select: {
          id: true,
          assignment: { select: { id: true, boothId: true } },
          invoice: { select: { id: true } },
        },
      })

      const applicationIds = applications.map((a) => a.id)
      const invoiceIds = applications
        .map((a) => a.invoice?.id)
        .filter((id): id is string => !!id)
      const boothIds = applications
        .map((a) => a.assignment?.boothId)
        .filter((id): id is string => !!id)

      if (invoiceIds.length > 0) {
        await tx.payment.deleteMany({ where: { invoiceId: { in: invoiceIds } } })
        await tx.invoiceLineItem.deleteMany({
          where: { invoiceId: { in: invoiceIds } },
        })
        await tx.invoice.deleteMany({ where: { id: { in: invoiceIds } } })
      }

      // Any leftover invoices for this vendor (defensive)
      const leftoverInvoices = await tx.invoice.findMany({
        where: { vendorId },
        select: { id: true },
      })
      if (leftoverInvoices.length > 0) {
        const leftoverIds = leftoverInvoices.map((i) => i.id)
        await tx.payment.deleteMany({ where: { invoiceId: { in: leftoverIds } } })
        await tx.invoiceLineItem.deleteMany({
          where: { invoiceId: { in: leftoverIds } },
        })
        await tx.invoice.deleteMany({ where: { id: { in: leftoverIds } } })
      }

      if (applicationIds.length > 0) {
        await tx.boothAssignment.deleteMany({
          where: { applicationId: { in: applicationIds } },
        })
        if (boothIds.length > 0) {
          await tx.booth.updateMany({
            where: { id: { in: boothIds } },
            data: { status: 'AVAILABLE' },
          })
        }

        await tx.approvalLog.deleteMany({
          where: { applicationId: { in: applicationIds } },
        })
        await tx.applicationWeek.deleteMany({
          where: { applicationId: { in: applicationIds } },
        })
        await tx.applicationAddOn.deleteMany({
          where: { applicationId: { in: applicationIds } },
        })
        await tx.document.deleteMany({
          where: { applicationId: { in: applicationIds } },
        })
        // Activity logs: applicationId SetNull on app delete — delete them fully for this vendor below
        await tx.application.deleteMany({ where: { id: { in: applicationIds } } })
      }

      await tx.document.deleteMany({ where: { vendorId } })
      await tx.message.deleteMany({ where: { vendorId } })
      await tx.notification.deleteMany({ where: { vendorId } })
      await tx.vendorActivityLog.deleteMany({ where: { vendorId } })
      await tx.vendorProfile.delete({ where: { id: vendorId } })
    }

    await tx.user.delete({ where: { id: userId } })
  })

  // Best-effort storage cleanup (do not fail the delete if storage errs)
  if (documentPaths.length > 0) {
    const { error } = await supabaseAdmin.storage
      .from('vendor-documents')
      .remove(documentPaths)
    if (error) console.error('vendor-documents cleanup:', error.message)
  }
  if (mediaPaths.length > 0) {
    const { error } = await supabaseAdmin.storage
      .from('vendor-media')
      .remove(mediaPaths)
    if (error) console.error('vendor-media cleanup:', error.message)
  }

  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
  if (authError) {
    console.error('Supabase auth delete failed after Prisma wipe:', authError.message)
    return {
      error:
        'User data was deleted from the database, but removing the auth account failed. Contact support.',
      status: 500 as const,
      email: target.email,
    }
  }

  return { ok: true as const, email: target.email }
}

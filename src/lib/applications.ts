'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { logVendorActivity } from '@/lib/vendor-activity'

async function getAuthenticatedVendorProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const vendorProfile = await prisma.vendorProfile.findUnique({
    where: { userId: user.id },
  })
  if (!vendorProfile) throw new Error('No vendor profile')
  return vendorProfile
}

export async function createDraftApplication(
  eventId: string
): Promise<{ applicationId: string; error?: string }> {
  try {
    const vendor = await getAuthenticatedVendorProfile()
    const application = await prisma.application.create({
      data: { vendorId: vendor.id, eventId, status: 'DRAFT' },
    })
    await logVendorActivity({
      vendorId: vendor.id,
      action: 'APPLICATION_CREATED',
      applicationId: application.id,
    })
    return { applicationId: application.id }
  } catch (e) {
    return { applicationId: '', error: String(e) }
  }
}

export async function updateApplicationWeeks(
  applicationId: string,
  weekIds: string[]
): Promise<{ error?: string }> {
  try {
    const vendor = await getAuthenticatedVendorProfile()
    const app = await prisma.application.findFirst({
      where: { id: applicationId, vendorId: vendor.id },
    })
    if (!app) return { error: 'Application not found' }

    await prisma.applicationWeek.deleteMany({ where: { applicationId } })
    if (weekIds.length > 0) {
      await prisma.applicationWeek.createMany({
        data: weekIds.map((eventWeekId) => ({ applicationId, eventWeekId })),
      })
    }
    return {}
  } catch (e) {
    return { error: String(e) }
  }
}

export async function updateApplicationDetails(
  applicationId: string,
  data: { productDescription?: string; productCategory?: string }
): Promise<{ error?: string }> {
  try {
    const vendor = await getAuthenticatedVendorProfile()
    const app = await prisma.application.findFirst({
      where: { id: applicationId, vendorId: vendor.id },
    })
    if (!app) return { error: 'Application not found' }
    await prisma.application.update({
      where: { id: applicationId },
      data: {
        productDescription: data.productDescription?.trim() || null,
        productCategory: data.productCategory?.trim() || null,
      },
    })
    return {}
  } catch (e) {
    return { error: String(e) }
  }
}

export async function updateApplicationBoothType(
  applicationId: string,
  boothTypeId: string
): Promise<{ error?: string }> {
  try {
    const vendor = await getAuthenticatedVendorProfile()
    const app = await prisma.application.findFirst({
      where: { id: applicationId, vendorId: vendor.id },
    })
    if (!app) return { error: 'Application not found' }

    await prisma.application.update({
      where: { id: applicationId },
      data: { boothTypeId },
    })
    return {}
  } catch (e) {
    return { error: String(e) }
  }
}

export async function createDocumentRecord(params: {
  applicationId: string
  docType: string
  fileName: string
  fileUrl: string
}): Promise<{ error?: string }> {
  try {
    const vendor = await getAuthenticatedVendorProfile()

    const existing = await prisma.document.findFirst({
      where: { applicationId: params.applicationId, docType: params.docType as never },
    })
    if (existing) {
      await prisma.document.update({
        where: { id: existing.id },
        data: { fileName: params.fileName, fileUrl: params.fileUrl, status: 'PENDING' },
      })
    } else {
      await prisma.document.create({
        data: {
          vendorId: vendor.id,
          applicationId: params.applicationId,
          docType: params.docType as never,
          fileName: params.fileName,
          fileUrl: params.fileUrl,
          status: 'PENDING',
        },
      })
    }
    await logVendorActivity({
      vendorId: vendor.id,
      action: 'DOCUMENT_UPLOADED',
      applicationId: params.applicationId,
      detail: `${params.docType}: ${params.fileName}`,
    })
    return {}
  } catch (e) {
    return { error: String(e) }
  }
}

export async function submitApplication(
  applicationId: string
): Promise<{ error?: string }> {
  try {
    const vendor = await getAuthenticatedVendorProfile()
    const app = await prisma.application.findFirst({
      where: { id: applicationId, vendorId: vendor.id },
    })
    if (!app) return { error: 'Application not found' }

    const isResubmit = app.status === 'REJECTED'
    await prisma.application.update({
      where: { id: applicationId },
      data: { status: 'SUBMITTED', submittedAt: new Date(), rejectionNote: null },
    })
    await logVendorActivity({
      vendorId: vendor.id,
      action: isResubmit ? 'APPLICATION_RESUBMITTED' : 'APPLICATION_SUBMITTED',
      applicationId,
    })
    revalidatePath('/vendor/dashboard')
    return {}
  } catch (e) {
    return { error: String(e) }
  }
}

export async function updateApplicationStatus(
  applicationId: string,
  status: string,
  rejectionNote?: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const staffUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!staffUser || (staffUser.role !== 'STAFF' && staffUser.role !== 'ADMIN')) {
      return { error: 'Not authorized' }
    }

    await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: status as never,
        ...(rejectionNote !== undefined && { rejectionNote }),
      },
    })

    await prisma.approvalLog.create({
      data: {
        applicationId,
        reviewedById: user.id,
        action: status,
        notes: rejectionNote ?? null,
      },
    })

    revalidatePath('/staff/queue')
    revalidatePath(`/staff/applications/${applicationId}`)
    return {}
  } catch (e) {
    return { error: String(e) }
  }
}

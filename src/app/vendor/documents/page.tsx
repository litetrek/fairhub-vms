import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import DocumentsClient from './DocumentsClient'

export default async function VendorDocumentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const vendorProfile = await prisma.vendorProfile.findUnique({
    where: { userId: user.id },
  })
  if (!vendorProfile) redirect('/auth/login')

  const documents = await prisma.document.findMany({
    where: { vendorId: vendorProfile.id },
    include: {
      application: { include: { event: true } },
    },
    orderBy: { uploadedAt: 'desc' },
  })

  const docsWithSignedUrls = await Promise.all(
    documents.map(async (doc) => {
      const { data } = await supabase.storage
        .from('vendor-documents')
        .createSignedUrl(doc.fileUrl, 60 * 60)
      return {
        id: doc.id,
        docType: doc.docType,
        fileName: doc.fileName,
        fileUrl: doc.fileUrl,
        signedUrl: data?.signedUrl ?? null,
        status: doc.status,
        uploadedAt: doc.uploadedAt.toISOString(),
        applicationId: doc.applicationId,
        applicationStatus: doc.application?.status ?? null,
        eventName: doc.application?.event.name ?? null,
      }
    })
  )

  return (
    <DocumentsClient
      initialDocs={docsWithSignedUrls}
      vendorProfileId={vendorProfile.id}
    />
  )
}

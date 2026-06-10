// Client-side Supabase Storage helpers.
// Upload runs in the browser; signed URLs can be generated from client or server.
import { createClient } from '@/lib/supabase/client'

const BUCKET = 'vendor-documents'

export async function uploadDocument(
  file: File,
  vendorId: string,
  applicationId: string,
  docType: string
): Promise<{ path: string; fileName: string; error?: string }> {
  const supabase = createClient()
  const ext = file.name.split('.').pop() ?? 'pdf'
  const path = `${vendorId}/${applicationId}/${docType}.${ext}`

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true })

  if (error) return { path: '', fileName: '', error: error.message }
  return { path: data.path, fileName: file.name }
}

export async function getSignedUrl(path: string): Promise<string | null> {
  const supabase = createClient()
  const { data } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 3600)
  return data?.signedUrl ?? null
}

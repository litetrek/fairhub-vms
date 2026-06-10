'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { submitApplication } from '@/lib/applications'

export default function ResubmitButton({ applicationId }: { applicationId: string }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function handleResubmit() {
    setIsLoading(true)
    try {
      const result = await submitApplication(applicationId)
      if (result.error) throw new Error(result.error)
      toast.success('Application resubmitted!')
      router.push('/vendor/dashboard')
    } catch (e) {
      toast.error(String(e))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleResubmit} disabled={isLoading}>
      {isLoading ? 'Submitting…' : 'Resubmit application'}
    </Button>
  )
}

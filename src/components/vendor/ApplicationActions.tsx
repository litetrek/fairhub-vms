'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type Props = {
  applicationId: string
  status: string
  invoiceStatus?: string | null
}

function getAction(status: string, invoiceStatus?: string | null): 'delete' | 'withdraw' | null {
  if (status === 'DRAFT') return 'delete'
  if (['SUBMITTED', 'UNDER_REVIEW', 'CONDITIONALLY_APPROVED'].includes(status)) return 'withdraw'
  if (status === 'APPROVED') {
    const paid = ['PAID', 'PARTIALLY_PAID'].includes(invoiceStatus ?? '')
    return paid ? null : 'withdraw'
  }
  return null
}

export default function ApplicationActions({ applicationId, status, invoiceStatus }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const action = getAction(status, invoiceStatus)
  if (!action) return null

  async function handleConfirm() {
    setLoading(true)
    setError(null)
    try {
      const url =
        action === 'delete'
          ? `/api/vendor/applications/${applicationId}`
          : `/api/vendor/applications/${applicationId}/withdraw`
      const method = action === 'delete' ? 'DELETE' : 'PATCH'
      const res = await fetch(url, { method })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Something went wrong')
        setLoading(false)
        return
      }

      setOpen(false)
      if (action === 'delete') {
        router.push('/vendor/applications')
      } else {
        router.refresh()
      }
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <>
      {action === 'delete' ? (
        <Button
          variant="destructive"
          size="sm"
          className="text-xs h-7"
          onClick={() => { setError(null); setOpen(true) }}
        >
          Delete
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-7"
          onClick={() => { setError(null); setOpen(true) }}
        >
          Withdraw
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>
              {action === 'delete' ? 'Delete draft application?' : 'Withdraw application?'}
            </DialogTitle>
            <DialogDescription>
              {action === 'delete'
                ? 'Are you sure you want to delete this draft? This cannot be undone.'
                : 'Are you sure you want to withdraw this application? Your booth spot will be released. This cannot be undone.'}
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-xs text-destructive px-1">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant={action === 'delete' ? 'destructive' : 'default'}
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? '…' : action === 'delete' ? 'Delete' : 'Withdraw'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

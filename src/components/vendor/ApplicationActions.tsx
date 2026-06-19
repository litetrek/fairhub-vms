'use client'

import { useState } from 'react'
import Link from 'next/link'
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

export default function ApplicationActions({ applicationId, status, invoiceStatus }: Props) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogAction, setDialogAction] = useState<'delete' | 'withdraw'>('delete')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function openDialog(action: 'delete' | 'withdraw') {
    setDialogAction(action)
    setError(null)
    setDialogOpen(true)
  }

  async function handleConfirm() {
    setLoading(true)
    setError(null)
    try {
      const url =
        dialogAction === 'delete'
          ? `/api/vendor/applications/${applicationId}`
          : `/api/vendor/applications/${applicationId}/withdraw`
      const method = dialogAction === 'delete' ? 'DELETE' : 'PATCH'
      const res = await fetch(url, { method })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Something went wrong')
        setLoading(false)
        return
      }

      setDialogOpen(false)
      if (dialogAction === 'delete') {
        router.push('/vendor/applications')
      } else {
        router.refresh()
      }
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  const canWithdraw =
    ['SUBMITTED', 'UNDER_REVIEW', 'CONDITIONALLY_APPROVED'].includes(status) ||
    (status === 'APPROVED' && !['PAID', 'PARTIALLY_PAID'].includes(invoiceStatus ?? ''))

  if (status === 'DRAFT') {
    return (
      <>
        <div className="flex items-center gap-2">
          <Button variant="default" size="sm" asChild>
            <Link href={`/vendor/applications/${applicationId}/edit`}>Continue</Link>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => openDialog('delete')}
          >
            Delete
          </Button>
        </div>
        <ConfirmDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          action={dialogAction}
          loading={loading}
          error={error}
          onConfirm={handleConfirm}
        />
      </>
    )
  }

  if (canWithdraw) {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => openDialog('withdraw')}
        >
          Withdraw
        </Button>
        <ConfirmDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          action={dialogAction}
          loading={loading}
          error={error}
          onConfirm={handleConfirm}
        />
      </>
    )
  }

  return null
}

type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  action: 'delete' | 'withdraw'
  loading: boolean
  error: string | null
  onConfirm: () => void
}

function ConfirmDialog({ open, onOpenChange, action, loading, error, onConfirm }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={action === 'delete' ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? '…' : action === 'delete' ? 'Delete' : 'Withdraw'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

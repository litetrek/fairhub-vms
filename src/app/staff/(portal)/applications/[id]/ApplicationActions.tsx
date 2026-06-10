'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { updateApplicationStatus } from '@/lib/applications'
import { generateInvoice, resendInvoiceEmail } from '@/lib/invoices'

type Props = {
  applicationId: string
  currentStatus: string
  hasBoothAssignment: boolean
  existingInvoiceId: string | null
}

const TERMINAL_STATUSES = ['APPROVED', 'REJECTED']

export default function ApplicationActions({
  applicationId,
  currentStatus,
  hasBoothAssignment,
  existingInvoiceId,
}: Props) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectionNote, setRejectionNote] = useState('')

  async function act(status: string, note?: string) {
    setIsLoading(true)
    try {
      const result = await updateApplicationStatus(applicationId, status, note)
      if (result.error) throw new Error(result.error)
      toast.success(`Status updated to ${status.replace(/_/g, ' ').toLowerCase()}`)
      router.refresh()
    } catch (e) {
      toast.error(String(e))
    } finally {
      setIsLoading(false)
    }
  }

  async function handleReject() {
    if (!rejectionNote.trim()) {
      toast.error('Please enter a rejection reason')
      return
    }
    setRejectOpen(false)
    await act('REJECTED', rejectionNote.trim())
    setRejectionNote('')
  }

  async function handleGenerateInvoice() {
    setIsLoading(true)
    try {
      const result = await generateInvoice(applicationId)
      if (result.error) throw new Error(result.error)
      toast.success('Invoice generated and sent')
      router.push(`/staff/invoices/${result.invoiceId}`)
    } catch (e) {
      toast.error(String(e))
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResendInvoice() {
    setIsLoading(true)
    try {
      const result = await resendInvoiceEmail(existingInvoiceId!)
      if (result.error) throw new Error(result.error)
      toast.success('Invoice email resent')
    } catch (e) {
      toast.error(String(e))
    } finally {
      setIsLoading(false)
    }
  }

  const isTerminal = TERMINAL_STATUSES.includes(currentStatus)

  return (
    <>
      <div className="space-y-3">
        {/* Invoice row */}
        {(hasBoothAssignment || existingInvoiceId) && (
          <div className="flex items-center gap-3 justify-end">
            {existingInvoiceId ? (
              <>
                <Button variant="outline" disabled={isLoading} onClick={handleResendInvoice}>
                  Resend invoice email
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/staff/invoices/${existingInvoiceId}`)}
                >
                  View invoice
                </Button>
              </>
            ) : (
              <Button disabled={isLoading} onClick={handleGenerateInvoice}>
                {isLoading ? 'Generating…' : 'Generate invoice'}
              </Button>
            )}
          </div>
        )}

        {/* Status row */}
        <div className="flex items-center gap-3 justify-end">
          {isTerminal ? (
            <p className="text-sm text-slate-400">
              This application has been {currentStatus.toLowerCase()}.
            </p>
          ) : (
            <>
              {currentStatus !== 'UNDER_REVIEW' && (
                <Button variant="outline" disabled={isLoading} onClick={() => act('UNDER_REVIEW')}>
                  Mark under review
                </Button>
              )}
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
                disabled={isLoading}
                onClick={() => setRejectOpen(true)}
              >
                Request changes
              </Button>
              <Button disabled={isLoading} onClick={() => act('APPROVED')}>
                {isLoading ? 'Saving…' : 'Approve'}
              </Button>
            </>
          )}
        </div>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request changes</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm text-slate-700 font-medium">
              Rejection note
              <span className="text-slate-400 font-normal ml-1">(visible to vendor)</span>
            </label>
            <textarea
              className="w-full border border-slate-200 rounded-lg p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/20 resize-none"
              rows={4}
              placeholder="Explain what changes are needed…"
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
            />
          </div>
          <DialogFooter showCloseButton>
            <Button onClick={handleReject} disabled={isLoading}>
              Send rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

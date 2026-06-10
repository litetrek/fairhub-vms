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
} from '@/components/ui/dialog'
import { recordPayment, resendPaymentConfirmation } from '@/lib/payments'
import { resendInvoiceEmail } from '@/lib/invoices'

type Props = {
  invoiceId: string
  remainingBalance: number
}

export default function RecordPaymentModal({ invoiceId, remainingBalance }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [method, setMethod] = useState<'CHECK' | 'ZELLE'>('CHECK')
  const [amount, setAmount] = useState(remainingBalance.toFixed(2))
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split('T')[0])
  const [referenceNumber, setReferenceNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  function openModal() {
    setAmount(remainingBalance.toFixed(2))
    setMethod('CHECK')
    setPaidAt(new Date().toISOString().split('T')[0])
    setReferenceNumber('')
    setNotes('')
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    setIsLoading(true)
    try {
      const result = await recordPayment({
        invoiceId,
        method,
        amount: parsedAmount,
        paidAt,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      })
      if (result.error) throw new Error(result.error)
      toast.success('Payment recorded')
      setOpen(false)
      router.refresh()
    } catch (e) {
      toast.error(String(e))
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResendInvoice() {
    setIsLoading(true)
    try {
      const result = await resendInvoiceEmail(invoiceId)
      if (result.error) throw new Error(result.error)
      toast.success('Invoice email resent')
    } catch (e) {
      toast.error(String(e))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <Button variant="outline" disabled={isLoading} onClick={handleResendInvoice}>
          Resend invoice email
        </Button>
        {remainingBalance > 0 && (
          <Button onClick={openModal} disabled={isLoading}>
            Record payment
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={(o) => { if (!o) setOpen(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Payment method
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as 'CHECK' | 'ZELLE')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
              >
                <option value="CHECK">Check</option>
                <option value="ZELLE">Zelle</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Date paid
              </label>
              <input
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Reference number{' '}
                <span className="text-slate-400 font-normal">(check # or Zelle ref)</span>
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Notes <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/20 resize-none"
              />
            </div>
            <div className="flex items-center gap-3 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving…' : 'Record payment'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

type ResendConfirmationButtonProps = { paymentId: string }

export function ResendConfirmationButton({ paymentId }: ResendConfirmationButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleResend() {
    setIsLoading(true)
    try {
      const result = await resendPaymentConfirmation(paymentId)
      if (result.error) throw new Error(result.error)
      toast.success('Confirmation email resent')
    } catch (e) {
      toast.error(String(e))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleResend}
      disabled={isLoading}
      className="text-xs text-slate-500 hover:text-slate-700 underline disabled:opacity-50"
    >
      {isLoading ? 'Sending…' : 'Resend confirmation'}
    </button>
  )
}

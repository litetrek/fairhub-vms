'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function PayButton({ invoiceId }: { invoiceId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePay() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/vendor/invoices/${invoiceId}/checkout`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to start checkout')
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="text-right">
      <Button onClick={handlePay} disabled={loading}>
        {loading ? 'Redirecting to Stripe…' : 'Pay online with Stripe'}
      </Button>
      {error && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}
    </div>
  )
}

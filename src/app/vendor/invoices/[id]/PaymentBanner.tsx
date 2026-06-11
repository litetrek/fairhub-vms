'use client'

import { useState } from 'react'

export function PaymentBanner({ payment }: { payment?: string }) {
  const [dismissed, setDismissed] = useState(false)

  if (!payment || dismissed) return null

  if (payment === 'success') {
    return (
      <div className="flex items-center justify-between rounded-md bg-green-50 border border-green-200 text-green-800 px-4 py-3 text-sm">
        <span>
          Payment submitted! Your invoice will be updated once payment is confirmed.
        </span>
        <button
          onClick={() => setDismissed(true)}
          className="ml-4 text-green-600 hover:text-green-800 font-medium shrink-0"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    )
  }

  if (payment === 'cancelled') {
    return (
      <div className="flex items-center justify-between rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 text-sm">
        <span>Payment was cancelled. Your invoice has not been charged.</span>
        <button
          onClick={() => setDismissed(true)}
          className="ml-4 text-yellow-600 hover:text-yellow-800 font-medium shrink-0"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    )
  }

  return null
}

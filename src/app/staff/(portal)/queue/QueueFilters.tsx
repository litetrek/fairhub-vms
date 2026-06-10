'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

const FILTERS = [
  { label: 'All', value: '' },
  { label: 'Submitted', value: 'SUBMITTED' },
  { label: 'Under review', value: 'UNDER_REVIEW' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
]

export default function QueueFilters({ current }: { current?: string }) {
  const router = useRouter()

  function setFilter(value: string) {
    const params = new URLSearchParams()
    if (value) params.set('status', value)
    router.push(`/staff/queue${value ? `?${params}` : ''}`)
  }

  return (
    <div className="flex gap-1 flex-wrap">
      {FILTERS.map(({ label, value }) => (
        <Button
          key={label}
          variant={current === value || (!current && value === '') ? 'default' : 'outline'}
          size="sm"
          className="text-xs h-7"
          onClick={() => setFilter(value)}
        >
          {label}
        </Button>
      ))}
    </div>
  )
}

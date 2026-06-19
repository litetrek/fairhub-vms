'use client'

import { useState } from 'react'
import Link from 'next/link'

type Vendor = {
  id: string
  businessName: string
  contactName: string
  phone: string
  businessType: string
  logoUrl: string | null
  applicationCount: number
  memberSince: string
}

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function VendorDirectoryClient({ vendors }: { vendors: Vendor[] }) {
  const [query, setQuery] = useState('')

  const filtered = vendors.filter((v) => {
    const q = query.toLowerCase()
    return (
      v.businessName.toLowerCase().includes(q) ||
      v.contactName.toLowerCase().includes(q)
    )
  })

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-slate-900">Vendor Directory</h1>
          <p className="text-sm text-slate-500 mt-0.5">{vendors.length} vendors</p>
        </div>
        <input
          type="text"
          placeholder="Search by name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 w-64 focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left text-xs font-medium text-slate-500 px-4 py-3 w-12"></th>
              <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Business</th>
              <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Contact</th>
              <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Phone</th>
              <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Type</th>
              <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Apps</th>
              <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Member since</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                  No vendors found
                </td>
              </tr>
            ) : (
              filtered.map((v) => (
                <tr
                  key={v.id}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <Link href={`/staff/vendors/${v.id}`} className="block">
                      {v.logoUrl ? (
                        <img
                          src={v.logoUrl}
                          alt={v.businessName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                          {initials(v.businessName)}
                        </div>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/staff/vendors/${v.id}`} className="font-medium text-slate-900 hover:text-blue-600">
                      {v.businessName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <Link href={`/staff/vendors/${v.id}`} className="block">
                      {v.contactName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    <Link href={`/staff/vendors/${v.id}`} className="block">
                      {v.phone || '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    <Link href={`/staff/vendors/${v.id}`} className="block">
                      {v.businessType || '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/staff/vendors/${v.id}`} className="block">
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        {v.applicationCount}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    <Link href={`/staff/vendors/${v.id}`} className="block">
                      {new Date(v.memberSince).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

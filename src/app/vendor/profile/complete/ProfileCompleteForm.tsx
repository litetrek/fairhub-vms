'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Props {
  userId: string
  email: string
}

export default function ProfileCompleteForm({ userId, email }: Props) {
  const router = useRouter()
  const [businessName, setBusinessName] = useState('')
  const [contactName, setContactName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/create-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email, phone, businessName, contactName }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Failed to save profile. Please try again.')
      setLoading(false)
      return
    }

    router.push('/vendor/dashboard')
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-medium text-foreground">GLOWFEST</h1>
        <p className="text-muted-foreground mt-1 text-sm">Annual Vendor &amp; Exhibitor Portal</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-medium">Complete your profile</CardTitle>
          <CardDescription>
            A few details to finish setting up your vendor account
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="businessName">Business name</Label>
              <Input
                id="businessName"
                type="text"
                placeholder="Acme Crafts"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contactName">Contact name</Label>
              <Input
                id="contactName"
                type="text"
                placeholder="Jane Smith"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">
                Phone{' '}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </CardContent>

          <CardFooter className="pt-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Saving...' : 'Continue to dashboard'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

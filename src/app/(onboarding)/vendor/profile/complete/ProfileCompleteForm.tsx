'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface InitialData {
  businessName: string
  contactName: string
  phone: string
  businessType: string
  yearsInBusiness: number | null
  description: string
  website: string
  instagramUrl: string
  facebookUrl: string
}

interface Props {
  userId: string
  email: string
  provider: string
  isSetup: boolean
  hasProfile: boolean
  initialData: InitialData
}

function normalizeUrl(value: string): string {
  const v = value.trim()
  if (!v) return v
  if (/^https?:\/\//i.test(v)) return v
  return `https://${v}`
}

export default function ProfileCompleteForm({
  userId,
  email,
  isSetup,
  hasProfile,
  initialData,
}: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [businessName, setBusinessName] = useState(initialData.businessName)
  const [contactName, setContactName] = useState(initialData.contactName)
  const [phone, setPhone] = useState(initialData.phone)
  const [businessType, setBusinessType] = useState(initialData.businessType)
  const [yearsInBusiness, setYearsInBusiness] = useState(
    initialData.yearsInBusiness !== null ? String(initialData.yearsInBusiness) : ''
  )
  const [description, setDescription] = useState(initialData.description)
  const [website, setWebsite] = useState(initialData.website)
  const [instagramUrl, setInstagramUrl] = useState(initialData.instagramUrl)
  const [facebookUrl, setFacebookUrl] = useState(initialData.facebookUrl)

  function handleNextStep(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setStep(2)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!hasProfile) {
        const createRes = await fetch('/api/auth/create-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, email, phone, businessName, contactName }),
        })
        if (!createRes.ok) {
          const d = await createRes.json()
          setError(d.error || 'Failed to create profile. Please try again.')
          setLoading(false)
          return
        }
      }

      const patchRes = await fetch('/api/vendor/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          contactName,
          phone,
          businessType: businessType || undefined,
          yearsInBusiness: yearsInBusiness !== '' ? Number(yearsInBusiness) : undefined,
          description,
          website: website ? normalizeUrl(website) : undefined,
          instagramUrl: instagramUrl || undefined,
          facebookUrl: facebookUrl || undefined,
        }),
      })

      if (!patchRes.ok) {
        const d = await patchRes.json()
        setError(d.error || 'Failed to save profile. Please try again.')
        setLoading(false)
        return
      }

      router.push('/vendor/dashboard')
    } catch {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  // Non-setup mode: show everything on one page
  if (!isSetup) {
    return (
      <div className="w-full max-w-lg">
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="businessName">Business name *</Label>
                  <Input
                    id="businessName"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contactName">Contact name *</Label>
                  <Input
                    id="contactName"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="businessType">Business type</Label>
                  <Input
                    id="businessType"
                    placeholder="e.g. Food, Crafts, Jewelry"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="yearsInBusiness">Years in business</Label>
                  <Input
                    id="yearsInBusiness"
                    type="number"
                    min="0"
                    max="100"
                    value={yearsInBusiness}
                    onChange={(e) => setYearsInBusiness(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  rows={4}
                  placeholder="Describe your products, your story, and why customers love what you do."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="text"
                  placeholder="yoursite.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="instagramUrl">Instagram</Label>
                  <Input
                    id="instagramUrl"
                    placeholder="@yourhandle"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="facebookUrl">Facebook</Label>
                  <Input
                    id="facebookUrl"
                    value={facebookUrl}
                    onChange={(e) => setFacebookUrl(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-2">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    )
  }

  // Setup wizard mode (isSetup = true)
  return (
    <div className="w-full max-w-lg">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-medium text-foreground">GLOWFEST</h1>
        <p className="text-muted-foreground mt-1 text-sm">Annual Vendor &amp; Exhibitor Portal</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-medium">
            Welcome to GlowFest Vendor Portal 🎉
          </CardTitle>
          <CardDescription>
            Let&apos;s set up your vendor profile so our team can learn about your business.
          </CardDescription>
          <p className="text-xs text-muted-foreground pt-1">Step {step} of 2</p>
          <div className="flex gap-1 mt-2">
            <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          </div>
        </CardHeader>

        {step === 1 && (
          <form onSubmit={handleNextStep}>
            <CardContent className="space-y-4 pt-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="s1-businessName">Business name *</Label>
                <Input
                  id="s1-businessName"
                  placeholder="Sunshine Crafts LLC"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="s1-contactName">Contact name *</Label>
                <Input
                  id="s1-contactName"
                  placeholder="Sandra Lee"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="s1-phone">Phone *</Label>
                <Input
                  id="s1-phone"
                  type="tel"
                  placeholder="(909) 555-0100"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="s1-businessType">Business type</Label>
                <Input
                  id="s1-businessType"
                  placeholder="e.g. Food, Crafts, Jewelry"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="s1-yearsInBusiness">Years in business</Label>
                <Input
                  id="s1-yearsInBusiness"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={yearsInBusiness}
                  onChange={(e) => setYearsInBusiness(e.target.value)}
                />
              </div>
            </CardContent>

            <CardFooter className="pt-2">
              <Button type="submit" className="w-full">
                Next →
              </Button>
            </CardFooter>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="s2-description">
                  What will you be selling? Tell us what makes your business special. *
                </Label>
                <Textarea
                  id="s2-description"
                  rows={4}
                  placeholder="Describe your products, your story, and why customers love what you do."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="s2-website">Website</Label>
                <Input
                  id="s2-website"
                  type="text"
                  placeholder="yoursite.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="s2-instagram">Instagram</Label>
                <Input
                  id="s2-instagram"
                  placeholder="@yourhandle"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="s2-facebook">Facebook</Label>
                <Input
                  id="s2-facebook"
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                />
              </div>
            </CardContent>

            <CardFooter className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setError(''); setStep(1) }}
                disabled={loading}
              >
                ← Back
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Saving...' : 'Complete Profile'}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  )
}

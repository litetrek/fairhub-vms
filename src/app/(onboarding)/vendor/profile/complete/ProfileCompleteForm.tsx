'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera } from 'lucide-react'
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

  // Step 1 fields
  const [businessName, setBusinessName] = useState(initialData.businessName)
  const [contactName, setContactName] = useState(initialData.contactName)
  const [phone, setPhone] = useState(initialData.phone)
  const [businessType, setBusinessType] = useState(initialData.businessType)
  const [yearsInBusiness, setYearsInBusiness] = useState(
    initialData.yearsInBusiness !== null ? String(initialData.yearsInBusiness) : ''
  )

  // Step 2 fields
  const [description, setDescription] = useState(initialData.description)
  const [website, setWebsite] = useState(initialData.website)
  const [instagramUrl, setInstagramUrl] = useState(initialData.instagramUrl)
  const [facebookUrl, setFacebookUrl] = useState(initialData.facebookUrl)

  // Step 3 — image upload
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [bannerImageUrl, setBannerImageUrl] = useState<string | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [bannerUploading, setBannerUploading] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [bannerError, setBannerError] = useState<string | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  async function uploadImage(file: File, type: 'logo' | 'banner'): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    const res = await fetch('/api/vendor/profile/upload', { method: 'POST', body: formData })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Upload failed')
    }
    const data = await res.json()
    return data.url as string
  }

  async function handleImageSelect(type: 'logo' | 'banner', file: File) {
    const setUploading = type === 'logo' ? setLogoUploading : setBannerUploading
    const setErr = type === 'logo' ? setLogoError : setBannerError
    const setUrl = type === 'logo' ? setLogoUrl : setBannerImageUrl
    const urlKey = type === 'logo' ? 'logoUrl' : 'bannerImageUrl'

    setUploading(true)
    setErr(null)
    try {
      const url = await uploadImage(file, type)
      setUrl(url)
      await fetch('/api/vendor/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [urlKey]: url }),
      })
    } catch (err) {
      setErr(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

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

      // Profile is now saved — advance to image upload step
      setStep(3)
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Non-setup mode: single page ────────────────────────────────────────────
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
                  <Input id="businessName" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contactName">Contact name *</Label>
                  <Input id="contactName" value={contactName} onChange={(e) => setContactName(e.target.value)} required />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone *</Label>
                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="businessType">Business type</Label>
                  <Input id="businessType" placeholder="e.g. Food, Crafts, Jewelry" value={businessType} onChange={(e) => setBusinessType(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="yearsInBusiness">Years in business</Label>
                  <Input id="yearsInBusiness" type="number" min="0" max="100" value={yearsInBusiness} onChange={(e) => setYearsInBusiness(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Description *</Label>
                <Textarea id="description" rows={4} placeholder="Describe your products, your story, and why customers love what you do." value={description} onChange={(e) => setDescription(e.target.value)} required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="website">Website</Label>
                <Input id="website" type="text" placeholder="yoursite.com" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="instagramUrl">Instagram</Label>
                  <Input id="instagramUrl" placeholder="@yourhandle" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="facebookUrl">Facebook</Label>
                  <Input id="facebookUrl" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} />
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

  // ── Setup wizard ───────────────────────────────────────────────────────────
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
          <p className="text-xs text-muted-foreground pt-1">Step {step} of 3</p>
          <div className="flex gap-1 mt-2">
            <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
          </div>
        </CardHeader>

        {/* Step 1 — Business Basics */}
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
                <Input id="s1-businessName" placeholder="Sunshine Crafts LLC" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="s1-contactName">Contact name *</Label>
                <Input id="s1-contactName" placeholder="Sandra Lee" value={contactName} onChange={(e) => setContactName(e.target.value)} required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="s1-phone">Phone *</Label>
                <Input id="s1-phone" type="tel" placeholder="(909) 555-0100" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="s1-businessType">Business type</Label>
                <Input id="s1-businessType" placeholder="e.g. Food, Crafts, Jewelry" value={businessType} onChange={(e) => setBusinessType(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="s1-yearsInBusiness">Years in business</Label>
                <Input id="s1-yearsInBusiness" type="number" min="0" max="100" placeholder="0" value={yearsInBusiness} onChange={(e) => setYearsInBusiness(e.target.value)} />
              </div>
            </CardContent>

            <CardFooter className="pt-2">
              <Button type="submit" className="w-full">Next →</Button>
            </CardFooter>
          </form>
        )}

        {/* Step 2 — About Your Business */}
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
                <Input id="s2-website" type="text" placeholder="yoursite.com" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="s2-instagram">Instagram</Label>
                <Input id="s2-instagram" placeholder="@yourhandle" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="s2-facebook">Facebook</Label>
                <Input id="s2-facebook" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} />
              </div>
            </CardContent>

            <CardFooter className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => { setError(''); setStep(1) }} disabled={loading}>
                ← Back
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Saving...' : 'Next →'}
              </Button>
            </CardFooter>
          </form>
        )}

        {/* Step 3 — Photos (optional) */}
        {step === 3 && (
          <div>
            <CardContent className="space-y-5 pt-4">
              <p className="text-sm text-muted-foreground">
                Add a logo and a feature photo so customers can recognise your booth. You can skip this and add photos later from your profile.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {/* Logo */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Business Logo</p>
                  <p className="text-xs text-muted-foreground">Square, PNG/JPG, max 5 MB</p>
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={logoUploading}
                    className="relative w-full h-36 rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors overflow-hidden bg-muted/30 flex items-center justify-center"
                  >
                    {logoUploading ? (
                      <span className="text-sm text-muted-foreground">Uploading…</span>
                    ) : logoUrl ? (
                      <img src={logoUrl} alt="Logo preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Camera className="w-7 h-7" />
                        <span className="text-xs">Click to upload</span>
                      </div>
                    )}
                  </button>
                  {logoError && <p className="text-xs text-destructive">{logoError}</p>}
                  {logoUrl && !logoUploading && (
                    <p className="text-xs text-green-500">Logo saved ✓</p>
                  )}
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageSelect('logo', file)
                      e.target.value = ''
                    }}
                  />
                </div>

                {/* Feature Photo */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Feature Photo</p>
                  <p className="text-xs text-muted-foreground">Landscape, shows your booth or products</p>
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={bannerUploading}
                    className="relative w-full h-36 rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors overflow-hidden bg-muted/30 flex items-center justify-center"
                  >
                    {bannerUploading ? (
                      <span className="text-sm text-muted-foreground">Uploading…</span>
                    ) : bannerImageUrl ? (
                      <img src={bannerImageUrl} alt="Feature photo preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Camera className="w-7 h-7" />
                        <span className="text-xs">Click to upload</span>
                      </div>
                    )}
                  </button>
                  {bannerError && <p className="text-xs text-destructive">{bannerError}</p>}
                  {bannerImageUrl && !bannerUploading && (
                    <p className="text-xs text-green-500">Photo saved ✓</p>
                  )}
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageSelect('banner', file)
                      e.target.value = ''
                    }}
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/vendor/dashboard')}
                disabled={logoUploading || bannerUploading}
              >
                Skip for now
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={() => router.push('/vendor/dashboard')}
                disabled={logoUploading || bannerUploading}
              >
                Go to Dashboard →
              </Button>
            </CardFooter>
          </div>
        )}
      </Card>
    </div>
  )
}

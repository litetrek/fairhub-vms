'use client'

import { useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Camera } from 'lucide-react'

const MAX_GALLERY = 6

type Props = {
  initialBusinessName: string
  initialContactName: string
  initialPhone: string
  initialBusinessType: string
  initialAddress: string
  initialCity: string
  initialState: string
  initialZip: string
  initialWebsite: string
  initialDescription: string
  initialLogoUrl: string | null
  initialBannerImageUrl: string | null
  initialGalleryImages: string[]
  initialInstagramUrl: string
  initialFacebookUrl: string
  initialTiktokUrl: string
  initialYearsInBusiness: number | null
  initialTaxId: string
  email: string
  isGoogleUser: boolean
  isSetup?: boolean
}

export default function ProfileClient({
  initialBusinessName,
  initialContactName,
  initialPhone,
  initialBusinessType,
  initialAddress,
  initialCity,
  initialState,
  initialZip,
  initialWebsite,
  initialDescription,
  initialLogoUrl,
  initialBannerImageUrl,
  initialGalleryImages,
  initialInstagramUrl,
  initialFacebookUrl,
  initialTiktokUrl,
  initialYearsInBusiness,
  initialTaxId,
  email,
  isGoogleUser,
  isSetup = false,
}: Props) {
  // ── Images ───────────────────────────────────────────────────
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl)
  const [bannerImageUrl, setBannerImageUrl] = useState<string | null>(initialBannerImageUrl)
  const [galleryImages, setGalleryImages] = useState<string[]>(initialGalleryImages)
  const [logoUploading, setLogoUploading] = useState(false)
  const [bannerUploading, setBannerUploading] = useState(false)
  const [galleryUploading, setGalleryUploading] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [bannerError, setBannerError] = useState<string | null>(null)
  const [galleryError, setGalleryError] = useState<string | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  // ── Business Info ────────────────────────────────────────────
  const [businessName, setBusinessName] = useState(initialBusinessName)
  const [contactName, setContactName] = useState(initialContactName)
  const [phone, setPhone] = useState(initialPhone)
  const [businessType, setBusinessType] = useState(initialBusinessType)
  const [yearsInBusiness, setYearsInBusiness] = useState<string>(
    initialYearsInBusiness !== null ? String(initialYearsInBusiness) : ''
  )
  const [taxId, setTaxId] = useState(initialTaxId)
  const [address, setAddress] = useState(initialAddress)
  const [city, setCity] = useState(initialCity)
  const [stateVal, setStateVal] = useState(initialState)
  const [zip, setZip] = useState(initialZip)
  const [description, setDescription] = useState(initialDescription)
  const [infoSaving, setInfoSaving] = useState(false)
  const [infoSuccess, setInfoSuccess] = useState<string | null>(null)
  const [infoError, setInfoError] = useState<string | null>(null)

  // ── Online Presence ──────────────────────────────────────────
  const [website, setWebsite] = useState(initialWebsite)
  const [instagramUrl, setInstagramUrl] = useState(initialInstagramUrl)
  const [facebookUrl, setFacebookUrl] = useState(initialFacebookUrl)
  const [tiktokUrl, setTiktokUrl] = useState(initialTiktokUrl)
  const [onlineSaving, setOnlineSaving] = useState(false)
  const [onlineSuccess, setOnlineSuccess] = useState<string | null>(null)
  const [onlineError, setOnlineError] = useState<string | null>(null)

  // ── Password ─────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // ── Helpers ──────────────────────────────────────────────────

  async function uploadImage(file: File, type: 'logo' | 'banner' | 'gallery') {
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

  async function patchProfile(body: Record<string, unknown>) {
    return fetch('/api/vendor/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  async function handleImageSelect(type: 'logo' | 'banner', file: File) {
    const setUploading = type === 'logo' ? setLogoUploading : setBannerUploading
    const setError = type === 'logo' ? setLogoError : setBannerError
    const setUrl = type === 'logo' ? setLogoUrl : setBannerImageUrl
    const urlKey = type === 'logo' ? 'logoUrl' : 'bannerImageUrl'
    setUploading(true)
    setError(null)
    try {
      const url = await uploadImage(file, type)
      setUrl(url)
      const res = await patchProfile({ [urlKey]: url })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to save image')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleGalleryAdd(file: File) {
    if (galleryImages.length >= MAX_GALLERY) return
    setGalleryUploading(true)
    setGalleryError(null)
    try {
      const url = await uploadImage(file, 'gallery')
      const updated = [...galleryImages, url]
      setGalleryImages(updated)
      const res = await patchProfile({ galleryImages: updated })
      if (!res.ok) {
        const data = await res.json()
        setGalleryError(data.error ?? 'Failed to save')
      }
    } catch (err) {
      setGalleryError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setGalleryUploading(false)
    }
  }

  async function handleGalleryRemove(urlToRemove: string) {
    const updated = galleryImages.filter((u) => u !== urlToRemove)
    setGalleryImages(updated)
    await patchProfile({ galleryImages: updated })
  }

  async function handleSaveInfo() {
    if (!businessName.trim()) { setInfoError('Business name is required'); return }
    if (!contactName.trim()) { setInfoError('Contact name is required'); return }
    if (!phone.trim()) { setInfoError('Phone is required'); return }
    setInfoSaving(true)
    setInfoSuccess(null)
    setInfoError(null)
    try {
      const res = await patchProfile({
        businessName, contactName, phone, businessType, description,
        yearsInBusiness: yearsInBusiness !== '' ? Number(yearsInBusiness) : null,
        taxId, address, city, state: stateVal, zip,
      })
      if (!res.ok) {
        const data = await res.json()
        setInfoError(data.error ?? 'Failed to save')
        return
      }
      setInfoSuccess('Changes saved')
    } catch {
      setInfoError('Network error. Please try again.')
    } finally {
      setInfoSaving(false)
    }
  }

  async function handleSaveOnline() {
    setOnlineSaving(true)
    setOnlineSuccess(null)
    setOnlineError(null)
    try {
      const res = await patchProfile({ website, instagramUrl, facebookUrl, tiktokUrl })
      if (!res.ok) {
        const data = await res.json()
        setOnlineError(data.error ?? 'Failed to save')
        return
      }
      setOnlineSuccess('Changes saved')
    } catch {
      setOnlineError('Network error. Please try again.')
    } finally {
      setOnlineSaving(false)
    }
  }

  async function handleChangePassword() {
    setPasswordSaving(true)
    setPasswordSuccess(null)
    setPasswordError(null)
    try {
      const res = await fetch('/api/vendor/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      })
      if (!res.ok) {
        const data = await res.json()
        setPasswordError(data.error ?? 'Failed to update password')
        return
      }
      setPasswordSuccess('Password updated successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      setPasswordError('Network error. Please try again.')
    } finally {
      setPasswordSaving(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {isSetup && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Welcome! Your account has been created. Please fill in your business details below to complete your profile.
        </div>
      )}
      <div>
        <h1 className="text-xl font-medium text-foreground">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {initialBusinessName || email} · {initialContactName} · {email}
        </p>
      </div>

      <Tabs defaultValue="business">
        <TabsList className="w-full">
          <TabsTrigger value="business" className="flex-1">Business</TabsTrigger>
          <TabsTrigger value="online" className="flex-1">Online</TabsTrigger>
          <TabsTrigger value="photos" className="flex-1">Photos</TabsTrigger>
          <TabsTrigger value="account" className="flex-1">Account</TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Photos ── */}
        <TabsContent value="photos" className="space-y-5 pt-4">

          {/* Logo + Feature Photo */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Logo &amp; Feature Photo</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4 items-start">
              {/* Logo — square, object-contain */}
              <div className="space-y-1.5 shrink-0">
                <p className="text-xs text-muted-foreground">Business Logo</p>
                <p className="text-xs text-muted-foreground/60">Square, max 5MB</p>
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={logoUploading}
                  className="relative w-36 h-36 rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors overflow-hidden bg-white/5 flex items-center justify-center"
                >
                  {logoUploading ? (
                    <span className="text-xs text-muted-foreground">Uploading…</span>
                  ) : logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Camera className="w-7 h-7" />
                      <span className="text-xs text-center px-2">Click to upload</span>
                    </div>
                  )}
                </button>
                {logoError && <p className="text-xs text-destructive">{logoError}</p>}
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelect('logo', f); e.target.value = '' }} />
              </div>

              {/* Banner — landscape, object-cover */}
              <div className="space-y-1.5 flex-1">
                <p className="text-xs text-muted-foreground">Feature Photo</p>
                <p className="text-xs text-muted-foreground/60">Landscape — booth or products</p>
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={bannerUploading}
                  className="relative w-full h-36 rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors overflow-hidden bg-muted/30 flex items-center justify-center"
                >
                  {bannerUploading ? (
                    <span className="text-sm text-muted-foreground">Uploading…</span>
                  ) : bannerImageUrl ? (
                    <img src={bannerImageUrl} alt="Feature photo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Camera className="w-7 h-7" />
                      <span className="text-xs">Click to upload</span>
                    </div>
                  )}
                </button>
                {bannerError && <p className="text-xs text-destructive">{bannerError}</p>}
                <input ref={bannerInputRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelect('banner', f); e.target.value = '' }} />
              </div>
            </CardContent>
          </Card>

          {/* Product Gallery */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium">Product Photos</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Up to {MAX_GALLERY} photos — hover to remove
                  </p>
                </div>
                {galleryImages.length < MAX_GALLERY && (
                  <Button type="button" variant="outline" size="sm"
                    disabled={galleryUploading} onClick={() => galleryInputRef.current?.click()}>
                    {galleryUploading ? 'Uploading…' : '+ Add photo'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <input ref={galleryInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleGalleryAdd(f); e.target.value = '' }} />
              {galleryError && <p className="text-xs text-destructive mb-2">{galleryError}</p>}

              {galleryImages.length === 0 ? (
                <button type="button" onClick={() => galleryInputRef.current?.click()}
                  disabled={galleryUploading}
                  className="w-full h-28 rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors flex items-center justify-center gap-2 text-muted-foreground">
                  <Camera className="w-5 h-5" />
                  <span className="text-sm">Add your first product photo</span>
                </button>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {galleryImages.map((url, i) => (
                    <div key={url} className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted/20">
                      <img src={url} alt={`Product ${i + 1}`} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => handleGalleryRemove(url)}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium">
                        Remove
                      </button>
                    </div>
                  ))}
                  {galleryImages.length < MAX_GALLERY && (
                    <button type="button" onClick={() => galleryInputRef.current?.click()}
                      disabled={galleryUploading}
                      className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground">
                      <Camera className="w-5 h-5" />
                      <span className="text-xs">{galleryUploading ? '…' : 'Add'}</span>
                    </button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 2: Business ── */}
        <TabsContent value="business" className="space-y-5 pt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Business Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input id="businessName" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contactName">Contact Name *</Label>
                  <Input id="contactName" value={contactName} onChange={(e) => setContactName(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="businessType">Business Type</Label>
                  <Input id="businessType" value={businessType} placeholder="e.g. Food, Crafts, Clothing"
                    onChange={(e) => setBusinessType(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="yearsInBusiness">Years in Business</Label>
                  <Input id="yearsInBusiness" type="number" min={0} max={100} value={yearsInBusiness}
                    onChange={(e) => setYearsInBusiness(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="taxId">Tax ID</Label>
                  <Input id="taxId" value={taxId} placeholder="EIN or SSN — optional, kept confidential"
                    onChange={(e) => setTaxId(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Business Address</Label>
                <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <div className="space-y-1.5 flex-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div className="space-y-1.5 flex-1">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" value={stateVal} onChange={(e) => setStateVal(e.target.value)} />
                </div>
                <div className="space-y-1.5 flex-1">
                  <Label htmlFor="zip">Zip</Label>
                  <Input id="zip" value={zip} onChange={(e) => setZip(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">About Your Business</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="description">Description *</Label>
                <Textarea id="description" rows={5} value={description}
                  placeholder="Tell us about your business, what makes you unique, and what you'll be selling at the fair"
                  onChange={(e) => setDescription(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {infoSuccess && <p className="text-sm text-green-500">{infoSuccess}</p>}
          {infoError && <p className="text-sm text-destructive">{infoError}</p>}
          <Button onClick={handleSaveInfo} disabled={infoSaving}>
            {infoSaving ? 'Saving…' : 'Save Changes'}
          </Button>
        </TabsContent>

        {/* ── Tab 3: Online ── */}
        <TabsContent value="online" className="space-y-5 pt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Online Presence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="website">Website</Label>
                <Input id="website" value={website} placeholder="yoursite.com"
                  onChange={(e) => setWebsite(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="instagramUrl">Instagram</Label>
                <Input id="instagramUrl" value={instagramUrl} placeholder="@yourhandle or full URL"
                  onChange={(e) => setInstagramUrl(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="facebookUrl">Facebook</Label>
                <Input id="facebookUrl" value={facebookUrl} placeholder="Page name or full URL"
                  onChange={(e) => setFacebookUrl(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tiktokUrl">TikTok</Label>
                <Input id="tiktokUrl" value={tiktokUrl} placeholder="@yourhandle or full URL"
                  onChange={(e) => setTiktokUrl(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {onlineSuccess && <p className="text-sm text-green-500">{onlineSuccess}</p>}
          {onlineError && <p className="text-sm text-destructive">{onlineError}</p>}
          <Button onClick={handleSaveOnline} disabled={onlineSaving}>
            {onlineSaving ? 'Saving…' : 'Save Changes'}
          </Button>
        </TabsContent>

        {/* ── Tab 4: Account ── */}
        <TabsContent value="account" className="space-y-5 pt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Email</span>
                <span className="text-foreground">{email}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Login method</span>
                <span className="text-foreground">{isGoogleUser ? 'Google' : 'Email / password'}</span>
              </div>
            </CardContent>
          </Card>

          {!isGoogleUser && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Change Password</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
                {passwordSuccess && <p className="text-sm text-green-500">{passwordSuccess}</p>}
                {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
                <Button onClick={handleChangePassword} disabled={passwordSaving}>
                  {passwordSaving ? 'Updating…' : 'Update Password'}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

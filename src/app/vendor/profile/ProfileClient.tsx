'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

type Props = {
  initialBusinessName: string
  initialContactName: string
  initialPhone: string
  email: string
  isGoogleUser: boolean
}

export default function ProfileClient({
  initialBusinessName,
  initialContactName,
  initialPhone,
  email,
  isGoogleUser,
}: Props) {
  const [businessName, setBusinessName] = useState(initialBusinessName)
  const [contactName, setContactName] = useState(initialContactName)
  const [phone, setPhone] = useState(initialPhone)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  async function handleSaveProfile() {
    setProfileSaving(true)
    setProfileSuccess(null)
    setProfileError(null)
    try {
      const res = await fetch('/api/vendor/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName, contactName, phone }),
      })
      if (!res.ok) {
        const data = await res.json()
        setProfileError(data.error ?? 'Failed to save changes')
        return
      }
      setProfileSuccess('Profile updated successfully')
    } catch {
      setProfileError('Network error. Please try again.')
    } finally {
      setProfileSaving(false)
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-medium text-foreground">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{email}</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Business Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="businessName">Business Name</Label>
            <Input
              id="businessName"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contactName">Contact Name</Label>
            <Input
              id="contactName"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          {profileSuccess && (
            <p className="text-sm text-green-500">{profileSuccess}</p>
          )}
          {profileError && (
            <p className="text-sm text-destructive">{profileError}</p>
          )}
          <Button onClick={handleSaveProfile} disabled={profileSaving}>
            {profileSaving ? 'Saving…' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      {!isGoogleUser && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Change Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            {passwordSuccess && (
              <p className="text-sm text-green-500">{passwordSuccess}</p>
            )}
            {passwordError && (
              <p className="text-sm text-destructive">{passwordError}</p>
            )}
            <Button onClick={handleChangePassword} disabled={passwordSaving}>
              {passwordSaving ? 'Updating…' : 'Update Password'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

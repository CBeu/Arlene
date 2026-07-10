import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { User } from '@supabase/supabase-js'
import { getProfile, updateDisplayName, type Profile } from '../lib/profileService'
import './ReunionBannerBar.css'

type ReunionBannerBarProps = {
  user: User
  onSignOut: () => void
}

export function ReunionBannerBar({ user, onSignOut }: ReunionBannerBarProps) {
  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [saving, setSaving] = useState(false)
  const queryClient = useQueryClient()

  const { data: profile } = useQuery({
    queryKey: ['profile', user.id],
    queryFn: () => getProfile(user.id),
  })

  const displayName = profile?.displayName || profile?.email || user.email || ''

  const startEditing = () => {
    setNameInput(profile?.displayName ?? '')
    setEditing(true)
  }

  const saveName = async () => {
    const trimmed = nameInput.trim()
    if (!trimmed || saving) return
    setSaving(true)
    try {
      await updateDisplayName(user.id, trimmed)
      queryClient.setQueryData<Profile>(['profile', user.id], (prev) =>
        prev ? { ...prev, displayName: trimmed } : prev,
      )
      // Cached member and comment lists show the old name until refetched
      queryClient.invalidateQueries({ queryKey: ['members'] })
      queryClient.invalidateQueries({ queryKey: ['comments'] })
      setEditing(false)
    } catch {
      // Keep the editor open so the user can retry
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="reunion-banner-bar">
      <span className="reunions-brand">Arlene</span>

      <div className="reunions-user-menu">
        {editing ? (
          <form
            className="display-name-form"
            onSubmit={(e) => {
              e.preventDefault()
              saveName()
            }}
          >
            <input
              className="display-name-input"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Your name"
              maxLength={80}
              disabled={saving}
              autoFocus
            />
            <button type="submit" className="reunions-signout" disabled={saving || !nameInput.trim()}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" className="reunions-signout" onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </button>
          </form>
        ) : (
          <span className="reunions-user-email">
            Hi, {displayName}
            <button
              type="button"
              className="display-name-edit"
              onClick={startEditing}
              aria-label="Edit display name"
              title="Edit display name"
            >
              ✎
            </button>
          </span>
        )}
        <button type="button" className="reunions-signout" onClick={onSignOut}>
          Sign out
        </button>
      </div>
    </section>
  )
}

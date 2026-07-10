import type { User } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'

export type Profile = {
  id: string
  displayName: string | null
  email: string | null
}

export async function getProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, email')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    throw error
  }

  return { id: data.id, displayName: data.display_name, email: data.email }
}

export async function updateDisplayName(userId: string, displayName: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName.trim() })
    .eq('id', userId)

  if (error) {
    console.error('Error updating display name:', error)
    throw error
  }
}

// Providers report names differently: Google sets full_name/name, Apple
// sends the name only on the very first authorization (as full_name, or
// given/family name parts)
function extractMetadataName(user: User): string | null {
  const meta = user.user_metadata ?? {}
  const fromParts = [meta.given_name, meta.family_name].filter(Boolean).join(' ')
  const name = meta.full_name || meta.name || fromParts
  return typeof name === 'string' && name.trim() ? name.trim() : null
}

// The signup trigger falls back to the part of the email before the "@",
// which for Apple private-relay addresses is a random string
function isFallbackName(profile: Profile): boolean {
  if (!profile.displayName) return true
  return profile.displayName === (profile.email ?? '').split('@')[0]
}

// After sign-in, copy the provider-supplied name onto the profile if the
// profile only has the email-prefix fallback. Apple sends the name only on
// first authorization, so this is the moment to capture it. Idempotent —
// never overwrites a real (or user-chosen) display name.
export async function syncProfileNameFromAuth(user: User): Promise<void> {
  const metadataName = extractMetadataName(user)
  if (!metadataName) return

  try {
    const profile = await getProfile(user.id)
    if (isFallbackName(profile) && profile.displayName !== metadataName) {
      await updateDisplayName(user.id, metadataName)
    }
  } catch (error) {
    // Non-fatal: the fallback name still shows and the user can edit it
    console.error('Error syncing profile name:', error)
  }
}

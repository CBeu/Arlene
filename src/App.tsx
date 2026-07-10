import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from './hooks/useAuth'
import { LoginPage } from './pages/LoginPage'
import { ReunionsPage } from './pages/ReunionsPage'
import { ReunionDetailPage } from './pages/ReunionDetailPage'
import { joinReunion } from './lib/reunionService'
import { syncProfileNameFromAuth } from './lib/profileService'
import type { Reunion } from './types/Reunion'

// Survives the OAuth redirect, which drops query params
const PENDING_JOIN_KEY = 'arlene:pendingJoinReunionId'

function readJoinParam(): string | null {
  return new URLSearchParams(window.location.search).get('join')
}

export default function App() {
  const { user, loading, signOut } = useAuth()
  const [selectedReunion, setSelectedReunion] = useState<Reunion | null>(null)
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  // Stash the join id right away so it isn't lost if the user has to log in first
  useEffect(() => {
    const joinId = readJoinParam()
    if (joinId) localStorage.setItem(PENDING_JOIN_KEY, joinId)
  }, [])

  // Capture the provider-supplied name onto the profile. Apple only sends
  // the name on the first-ever authorization, so this must run right after
  // sign-in; it's a no-op when the profile already has a real name.
  useEffect(() => {
    if (!user) return
    syncProfileNameFromAuth(user).then(() => {
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] })
    })
  }, [user, queryClient])

  // Once signed in, complete any pending join and open that reunion
  useEffect(() => {
    if (!user) return
    const joinId = readJoinParam() ?? localStorage.getItem(PENDING_JOIN_KEY)
    if (!joinId) return

    localStorage.removeItem(PENDING_JOIN_KEY)
    window.history.replaceState({}, '', window.location.pathname)

    let cancelled = false
    setIsJoining(true)
    joinReunion(user.id, joinId)
      .then((reunion) => {
        queryClient.invalidateQueries({ queryKey: ['reunions', user.id] })
        if (!cancelled) setSelectedReunion(reunion)
      })
      .catch((err) => {
        if (!cancelled) setJoinError(err instanceof Error ? err.message : 'Failed to join reunion')
      })
      .finally(() => {
        if (!cancelled) setIsJoining(false)
      })

    return () => {
      cancelled = true
    }
  }, [user, queryClient])

  // Avoid flashing the login page while the session loads
  if (loading || isJoining) return null

  if (!user) return <LoginPage />

  if (selectedReunion) {
    return (
      <ReunionDetailPage
        user={user}
        onSignOut={signOut}
        reunion={selectedReunion}
        onBack={() => setSelectedReunion(null)}
        onUpdated={setSelectedReunion}
        onDeleted={() => setSelectedReunion(null)}
      />
    )
  }

  return (
    <ReunionsPage
      user={user}
      onSignOut={signOut}
      onSelectReunion={setSelectedReunion}
      joinError={joinError}
      onDismissJoinError={() => setJoinError(null)}
    />
  )
}

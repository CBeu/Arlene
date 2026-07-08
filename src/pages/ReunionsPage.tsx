import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { ReunionBannerBar } from '../components/ReunionBannerBar'
import { CreateReunionDialog, type CreateReunionFormData } from '../components/CreateReunionDialog'
import { JoinReunionPopover } from '../components/JoinReunionPopover'
import { getUserReunions, createReunion, addUserToReunion } from '../lib/reunionService'
import type { Reunion } from '../types/Reunion'
import './ReunionsPage.css'

type ReunionsPageProps = {
  user: User
  onSignOut: () => void
  onSelectReunion: (reunion: Reunion) => void
  joinError?: string | null
  onDismissJoinError?: () => void
}

export function ReunionsPage({ user, onSignOut, onSelectReunion, joinError, onDismissJoinError }: ReunionsPageProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isJoinPopoverOpen, setIsJoinPopoverOpen] = useState(false)
  const [reunions, setReunions] = useState<Reunion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReunions = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getUserReunions(user.id)
        setReunions(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch reunions')
      } finally {
        setIsLoading(false)
      }
    }

    fetchReunions()
  }, [user.id])

  const handleCreateReunion = async (formData: CreateReunionFormData) => {
    try {
      setError(null)
      const newReunion = await createReunion(user.id, formData)
      setReunions((prev) => [...prev, newReunion])
      setIsDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create reunion')
    }
  }

  const handleJoinReunion = async (reunionId: string) => {
    try {
      setError(null)
      await addUserToReunion(user.id, reunionId)
      const data = await getUserReunions(user.id)
      setReunions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join reunion')
      throw err
    }
  }

  return (
    <main className="reunions">
      <ReunionBannerBar user={user} onSignOut={onSignOut} />

      <section className="reunions-card">
        <div className="reunions-card-header">
          <h1>View Reunions</h1>
          <div className="reunions-card-buttons">
            <button type="button" className="btn-create-reunion" onClick={() => setIsDialogOpen(true)}>
              Create Reunion
            </button>
            <button type="button" className="btn-join-reunion" onClick={() => setIsJoinPopoverOpen(true)}>
              Join Reunion
            </button>
          </div>
        </div>

        {joinError && (
          <p className="error-message">
            Could not join reunion: {joinError}{' '}
            {onDismissJoinError && (
              <button type="button" className="error-dismiss" onClick={onDismissJoinError}>
                Dismiss
              </button>
            )}
          </p>
        )}
        {error && <p className="error-message">{error}</p>}

        {isLoading ? (
          <p className="loading-message">Loading reunions...</p>
        ) : reunions.length === 0 ? (
          <p className="empty-message">No reunions yet. Create one to get started!</p>
        ) : (
          <div className="reunions-grid">
            {reunions.map((reunion) => (
              <button
                key={reunion.reunionId}
                type="button"
                className="reunion-card"
                onClick={() => onSelectReunion(reunion)}
              >
                <h2 className="reunion-card-name">{reunion.name}</h2>
                <div className="reunion-card-dates">
                  {reunion.reunionStartDate && reunion.reunionEndDate
                    ? `${reunion.reunionStartDate.toLocaleDateString()} - ${reunion.reunionEndDate.toLocaleDateString()}`
                    : reunion.reunionStartDate
                      ? `Starts ${reunion.reunionStartDate.toLocaleDateString()}`
                      : reunion.reunionEndDate
                        ? `Ends ${reunion.reunionEndDate.toLocaleDateString()}`
                        : 'No dates set'}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <CreateReunionDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} onSubmit={handleCreateReunion} />
      <JoinReunionPopover isOpen={isJoinPopoverOpen} onClose={() => setIsJoinPopoverOpen(false)} onSubmit={handleJoinReunion} />
    </main>
  )
}

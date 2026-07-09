import { useState, useEffect, useMemo } from 'react'
import type { User } from '@supabase/supabase-js'
import { ReunionBannerBar } from '../components/ReunionBannerBar'
import { ReunionOverviewPanel } from '../components/ReunionOverviewPanel'
import { NominationDetailPage } from './NominationDetailPage'
import { SubmitNominationForm } from '../components/SubmitNominationForm'
import { ViewNominationsPanel } from '../components/ViewNominationsPanel'
import { createNomination, getReunionNominations, type CreateNominationInput } from '../lib/nominationService'
import { getJoinLink, updateReunion, deleteReunion } from '../lib/reunionService'
import type { CreateReunionFormData } from '../components/CreateReunionDialog'
import { CreateReunionDialog } from '../components/CreateReunionDialog'
import type { Reunion } from '../types/Reunion'
import type { ReunionNomination } from '../types/ReunionNomination'
import './ReunionDetailPage.css'

type Tab = 'overview' | 'nominations' | 'submit' | 'voting'

type ReunionDetailPageProps = {
  user: User
  onSignOut: () => void
  reunion: Reunion
  onBack: () => void
  onUpdated: (updated: Reunion) => void
  onDeleted: () => void
}

// datetime-local inputs need "YYYY-MM-DDTHH:mm" in local time
function toDateTimeLocal(date?: Date): string | undefined {
  if (!date) return undefined
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// date inputs need "YYYY-MM-DD" in local time
function toDateInput(date?: Date): string | undefined {
  return toDateTimeLocal(date)?.slice(0, 10)
}

export function ReunionDetailPage({ user, onSignOut, reunion, onBack, onUpdated, onDeleted }: ReunionDetailPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [selectedNomination, setSelectedNomination] = useState<ReunionNomination | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [nominations, setNominations] = useState<ReunionNomination[]>([])
  const [isLoadingNominations, setIsLoadingNominations] = useState(false)
  const [nominationsError, setNominationsError] = useState<string | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [deletingReunion, setDeletingReunion] = useState(false)
  const [ownerError, setOwnerError] = useState<string | null>(null)

  const isCreator = reunion.createdByUUID === user.id

  const editInitialValues = useMemo<CreateReunionFormData>(
    () => ({
      name: reunion.name,
      description: reunion.description,
      reunionStartDate: toDateTimeLocal(reunion.reunionStartDate),
      reunionEndDate: toDateTimeLocal(reunion.reunionEndDate),
      nominationDeadline: toDateInput(reunion.nominationDeadline),
      votingDeadline: toDateInput(reunion.votingDeadline),
    }),
    [reunion],
  )

  const nominationsClosed =
    reunion.nominationDeadline !== undefined && new Date() >= reunion.nominationDeadline

  const handleUpdateReunion = async (formData: CreateReunionFormData) => {
    setOwnerError(null)
    try {
      const updated = await updateReunion(reunion.reunionId!, formData)
      setIsEditOpen(false)
      onUpdated(updated)
    } catch {
      setOwnerError('Could not update the reunion. Please try again.')
      setIsEditOpen(false)
    }
  }

  const handleDeleteReunion = async () => {
    if (deletingReunion) return
    if (!window.confirm('Delete this reunion? All of its nominations and comments will be deleted too.')) return

    setDeletingReunion(true)
    setOwnerError(null)
    try {
      await deleteReunion(reunion.reunionId!)
      onDeleted()
    } catch {
      setOwnerError('Could not delete the reunion. Please try again.')
      setDeletingReunion(false)
    }
  }

  const handleShare = async () => {
    await navigator.clipboard.writeText(getJoinLink(reunion.reunionId!))
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2500)
  }

  useEffect(() => {
    if (activeTab === 'nominations') {
      const fetchNominations = async () => {
        try {
          setIsLoadingNominations(true)
          setNominationsError(null)
          const data = await getReunionNominations(reunion.reunionId!)
          setNominations(data)
        } catch (err) {
          setNominationsError(err instanceof Error ? err.message : 'Failed to fetch nominations')
        } finally {
          setIsLoadingNominations(false)
        }
      }

      fetchNominations()
    }
  }, [activeTab, reunion.reunionId])

  const handleNominationSubmit = async (formData: CreateNominationInput) => {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      await createNomination(user.id, reunion.reunionId!, formData)
      setSubmitSuccess(true)
      setTimeout(() => setSubmitSuccess(false), 3000)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit nomination')
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }

  if (selectedNomination) {
    return (
      <NominationDetailPage
        user={user}
        onSignOut={onSignOut}
        nomination={selectedNomination}
        onBack={() => setSelectedNomination(null)}
        onDeleted={() => {
          setNominations((prev) =>
            prev.filter((n) => n.reunionNominationId !== selectedNomination.reunionNominationId),
          )
          setSelectedNomination(null)
        }}
        onUpdated={(updated) => {
          setNominations((prev) =>
            prev.map((n) => (n.reunionNominationId === updated.reunionNominationId ? updated : n)),
          )
          setSelectedNomination(updated)
        }}
      />
    )
  }

  return (
    <main className="reunion-detail">
      <ReunionBannerBar user={user} onSignOut={onSignOut} />

      <section className="reunions-card">
        <div className="reunion-detail-header">
          <button type="button" className="back-button" onClick={onBack} aria-label="Back to reunions">
            ← Back
          </button>
          <h1>{reunion.name}</h1>
          <div className="owner-actions">
            {isCreator && (
              <>
                <button
                  type="button"
                  className="owner-edit-button"
                  onClick={() => setIsEditOpen(true)}
                  disabled={deletingReunion}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="owner-delete-button"
                  onClick={handleDeleteReunion}
                  disabled={deletingReunion}
                >
                  {deletingReunion ? 'Deleting…' : 'Delete'}
                </button>
              </>
            )}
            <button type="button" className="share-button" onClick={handleShare}>
              {linkCopied ? 'Link copied!' : 'Share'}
            </button>
          </div>
        </div>

        {ownerError && <p className="owner-error">{ownerError}</p>}

        <div className="reunion-tabs">
          <button
            type="button"
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Reunion Overview
          </button>
          <button
            type="button"
            className={`tab-button ${activeTab === 'nominations' ? 'active' : ''}`}
            onClick={() => setActiveTab('nominations')}
          >
            View Nominations
          </button>
          <button
            type="button"
            className={`tab-button ${activeTab === 'submit' ? 'active' : ''}`}
            onClick={() => setActiveTab('submit')}
          >
            Submit Nomination
          </button>
          <button
            type="button"
            className={`tab-button ${activeTab === 'voting' ? 'active' : ''}`}
            onClick={() => setActiveTab('voting')}
          >
            Voting
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="tab-panel">
              <ReunionOverviewPanel reunion={reunion} />
            </div>
          )}
          {activeTab === 'nominations' && (
            <div className="tab-panel">
              <ViewNominationsPanel
                nominations={nominations}
                isLoading={isLoadingNominations}
                error={nominationsError}
                onNominationClick={setSelectedNomination}
              />
            </div>
          )}
          {activeTab === 'submit' && (
            <div className="tab-panel">
              <h2>Submit Nomination</h2>
              {nominationsClosed ? (
                <p>
                  Nominations closed on {reunion.nominationDeadline!.toLocaleDateString()}. New
                  submissions are no longer accepted.
                </p>
              ) : (
                <>
                  {submitSuccess && <div className="success-message">Nomination submitted successfully!</div>}
                  <SubmitNominationForm
                    onSubmit={handleNominationSubmit}
                    isLoading={isSubmitting}
                    error={submitError}
                  />
                </>
              )}
            </div>
          )}
          {activeTab === 'voting' && (
            <div className="tab-panel">
              <h2>Voting</h2>
              {!nominationsClosed && reunion.nominationDeadline ? (
                <p>
                  Voting will start on {reunion.nominationDeadline.toLocaleDateString()}, once
                  nominations close.
                </p>
              ) : (
                <p>Voting content will go here</p>
              )}
            </div>
          )}
        </div>
      </section>

      <CreateReunionDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleUpdateReunion}
        initialValues={editInitialValues}
        title="Edit Reunion"
        submitLabel="Save Changes"
      />
    </main>
  )
}

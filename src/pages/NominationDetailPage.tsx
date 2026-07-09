import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { ReunionBannerBar } from '../components/ReunionBannerBar'
import type { ReunionNomination } from '../types/ReunionNomination'
import type { NominationComment } from '../types/NominationComment'
import { createComment, deleteComment, getNominationComments } from '../lib/nominationCommentService'
import { deleteNomination, updateNomination, type CreateNominationInput } from '../lib/nominationService'
import { SubmitNominationForm } from '../components/SubmitNominationForm'
import './ReunionDetailPage.css'
import './NominationDetailPage.css'

type Tab = 'details' | 'comments'

type NominationDetailPageProps = {
  user: User
  onSignOut: () => void
  nomination: ReunionNomination
  onBack: () => void
  onDeleted: () => void
  onUpdated: (updated: ReunionNomination) => void
}

function formatPrice(price: number): string {
  return price.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
}

function formatCommentDate(createdAt: string): string {
  return new Date(createdAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function NominationDetailPage({ user, onSignOut, nomination, onBack, onDeleted, onUpdated }: NominationDetailPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>('details')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [comments, setComments] = useState<NominationComment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [commentsError, setCommentsError] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const nominationId = nomination.reunionNominationId

  useEffect(() => {
    if (!nominationId) {
      setCommentsLoading(false)
      return
    }
    let cancelled = false
    getNominationComments(nominationId)
      .then((loaded) => {
        if (!cancelled) setComments(loaded)
      })
      .catch(() => {
        if (!cancelled) setCommentsError('Could not load comments.')
      })
      .finally(() => {
        if (!cancelled) setCommentsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [nominationId])

  const handleSubmitComment = async (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = newComment.trim()
    if (!trimmed || !nominationId || submitting) return

    setSubmitting(true)
    setCommentsError(null)
    try {
      const created = await createComment(user.id, nominationId, trimmed)
      setComments((prev) => [...prev, created])
      setNewComment('')
    } catch {
      setCommentsError('Could not post your comment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    setCommentsError(null)
    try {
      await deleteComment(commentId)
      setComments((prev) => prev.filter((c) => c.nominationCommentId !== commentId))
    } catch {
      setCommentsError('Could not delete the comment. Please try again.')
    }
  }

  const handleDeleteNomination = async () => {
    if (!nominationId || deleting) return
    if (!window.confirm('Delete this nomination? Its comments will be deleted too.')) return

    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteNomination(nominationId)
      onDeleted()
    } catch {
      setDeleteError('Could not delete the nomination. Please try again.')
      setDeleting(false)
    }
  }

  const handleUpdateNomination = async (formData: CreateNominationInput) => {
    if (!nominationId) return
    setSaving(true)
    setSaveError(null)
    try {
      const updated = await updateNomination(nominationId, formData)
      setEditing(false)
      onUpdated(updated)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update nomination')
      throw err
    } finally {
      setSaving(false)
    }
  }

  const stats: { label: string; value: string }[] = []
  if (nomination.bedrooms != null) stats.push({ label: 'Bedrooms', value: String(nomination.bedrooms) })
  if (nomination.bathrooms != null) stats.push({ label: 'Bathrooms', value: String(nomination.bathrooms) })
  if (nomination.capacity != null) stats.push({ label: 'Capacity', value: String(nomination.capacity) })
  if (nomination.units != null) stats.push({ label: 'Units', value: String(nomination.units) })
  if (nomination.price != null) stats.push({ label: 'Price', value: formatPrice(nomination.price) })

  return (
    <main className="reunion-detail">
      <ReunionBannerBar user={user} onSignOut={onSignOut} />

      <section className="reunions-card">
        <div className="reunion-detail-header">
          <button type="button" className="back-button" onClick={onBack} aria-label="Back to nominations">
            ← Back
          </button>
          <h1>{nomination.name}</h1>
          {nomination.createdByUUID === user.id && (
            <div className="nomination-owner-actions">
              <button
                type="button"
                className="nomination-edit-button"
                onClick={() => {
                  setSaveError(null)
                  setEditing((prev) => !prev)
                  setActiveTab('details')
                }}
                disabled={deleting || saving}
              >
                {editing ? 'Cancel Edit' : 'Edit'}
              </button>
              <button
                type="button"
                className="nomination-delete-button"
                onClick={handleDeleteNomination}
                disabled={deleting || saving}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          )}
        </div>

        {deleteError && <p className="comments-error">{deleteError}</p>}

        <div className="reunion-tabs">
          <button
            type="button"
            className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Nomination Details
          </button>
          <button
            type="button"
            className={`tab-button ${activeTab === 'comments' ? 'active' : ''}`}
            onClick={() => setActiveTab('comments')}
          >
            Nomination Comments
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'details' && editing && (
            <div className="tab-panel">
              <h2>Edit Nomination</h2>
              <SubmitNominationForm
                onSubmit={handleUpdateNomination}
                isLoading={saving}
                error={saveError}
                submitLabel="Save Changes"
                loadingLabel="Saving..."
                initialValues={{
                  name: nomination.name,
                  description: nomination.description,
                  city: nomination.city,
                  state: nomination.state,
                  url: nomination.url,
                  bedrooms: nomination.bedrooms,
                  bathrooms: nomination.bathrooms,
                  capacity: nomination.capacity,
                  units: nomination.units,
                  price: nomination.price,
                }}
              />
            </div>
          )}
          {activeTab === 'details' && !editing && (
            <div className="tab-panel">
              <div className="nomination-detail">
                <p className="nomination-detail-location">
                  {nomination.city}, {nomination.state}
                </p>
                {nomination.description && (
                  <p className="nomination-detail-description">{nomination.description}</p>
                )}
                {stats.length > 0 && (
                  <dl className="nomination-detail-stats">
                    {stats.map((stat) => (
                      <div key={stat.label} className="nomination-detail-stat">
                        <dt>{stat.label}</dt>
                        <dd>{stat.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {nomination.url && (
                  <a
                    className="nomination-detail-link"
                    href={nomination.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View listing ↗
                  </a>
                )}
              </div>
            </div>
          )}
          {activeTab === 'comments' && (
            <div className="tab-panel">
              <h2>Comments</h2>

              {commentsError && <p className="comments-error">{commentsError}</p>}

              {commentsLoading ? (
                <p>Loading comments…</p>
              ) : comments.length === 0 ? (
                <p>No comments yet. Be the first to weigh in!</p>
              ) : (
                <ul className="comment-list">
                  {comments.map((comment) => (
                    <li key={comment.nominationCommentId} className="comment-item">
                      <div className="comment-meta">
                        <span className="comment-author">{comment.createdByName}</span>
                        <span className="comment-date">{formatCommentDate(comment.createdAt)}</span>
                        {comment.createdByUUID === user.id && (
                          <button
                            type="button"
                            className="comment-delete"
                            onClick={() => handleDeleteComment(comment.nominationCommentId)}
                            aria-label="Delete comment"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      <p className="comment-body">{comment.comment}</p>
                    </li>
                  ))}
                </ul>
              )}

              <form className="comment-form" onSubmit={handleSubmitComment}>
                <textarea
                  className="comment-input"
                  value={newComment}
                  onChange={(event) => setNewComment(event.target.value)}
                  placeholder="Add a comment…"
                  rows={3}
                  disabled={submitting}
                />
                <button
                  type="submit"
                  className="comment-submit"
                  disabled={submitting || !newComment.trim()}
                >
                  {submitting ? 'Posting…' : 'Post Comment'}
                </button>
              </form>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

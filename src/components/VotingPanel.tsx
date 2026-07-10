import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { User } from '@supabase/supabase-js'
import type { Reunion } from '../types/Reunion'
import type { ReunionNomination } from '../types/ReunionNomination'
import { getMyVote, saveVote } from '../lib/voteService'
import { BobRanker } from './BobRanker'
import { ExpandableDescription } from './ExpandableDescription'
import './VotingPanel.css'

type VotingPanelProps = {
  user: User
  reunion: Reunion
  nominations: ReunionNomination[]
  isLoadingNominations: boolean
  // When set, nominations are still open: users can build and preview a
  // ballot but not submit it until this date
  nominationsCloseAt?: Date
}

type Mode = 'view' | 'choose' | 'manual' | 'bob' | 'confirm'

function InfoButton({
  nomination,
  onShowInfo,
}: {
  nomination: ReunionNomination
  onShowInfo: (nomination: ReunionNomination) => void
}) {
  return (
    <button
      type="button"
      className="ballot-info-button"
      onClick={(e) => {
        e.stopPropagation()
        onShowInfo(nomination)
      }}
      aria-label={`View details for ${nomination.name}`}
      title="View details"
    >
      i
    </button>
  )
}

function NominationInfoDialog({
  nomination,
  onClose,
}: {
  nomination: ReunionNomination
  onClose: () => void
}) {
  const stats: { label: string; value: string }[] = []
  if (nomination.bedrooms != null) stats.push({ label: 'Bedrooms', value: String(nomination.bedrooms) })
  if (nomination.bathrooms != null) stats.push({ label: 'Bathrooms', value: String(nomination.bathrooms) })
  if (nomination.capacity != null) stats.push({ label: 'Capacity', value: String(nomination.capacity) })
  if (nomination.units != null) stats.push({ label: 'Units', value: String(nomination.units) })
  if (nomination.price != null)
    stats.push({
      label: 'Price',
      value: nomination.price.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }),
    })

  return (
    <div className="ballot-info-overlay" onClick={onClose}>
      <div className="ballot-info-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ballot-info-header">
          <h3>{nomination.name}</h3>
          <button type="button" className="ballot-info-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <p className="ballot-info-location">
          {nomination.city}, {nomination.state}
        </p>
        {nomination.description && (
          <ExpandableDescription text={nomination.description} className="ballot-info-description" />
        )}
        {stats.length > 0 && (
          <dl className="ballot-info-stats">
            {stats.map((stat) => (
              <div key={stat.label} className="ballot-info-stat">
                <dt>{stat.label}</dt>
                <dd>{stat.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {nomination.url && (
          <a href={nomination.url} target="_blank" rel="noopener noreferrer" className="ballot-info-link">
            View listing ↗
          </a>
        )}
      </div>
    </div>
  )
}

function BallotList({
  order,
  nominationsById,
  onShowInfo,
}: {
  order: string[]
  nominationsById: Map<string, ReunionNomination>
  onShowInfo: (nomination: ReunionNomination) => void
}) {
  return (
    <ol className="ballot-list">
      {order.map((id) => {
        const nomination = nominationsById.get(id)
        if (!nomination) return null
        return (
          <li key={id} className="ballot-item">
            <span className="ballot-item-name">{nomination.name}</span>
            <span className="ballot-item-location">
              {nomination.city}, {nomination.state}
            </span>
            <span className="ballot-item-arrows">
              <InfoButton nomination={nomination} onShowInfo={onShowInfo} />
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function BallotEditor({
  initialOrder,
  nominationsById,
  onSubmit,
  onCancel,
  submitting,
  submitLocked = false,
  onShowInfo,
}: {
  initialOrder: string[]
  nominationsById: Map<string, ReunionNomination>
  onSubmit: (order: string[]) => void
  onCancel: () => void
  submitting: boolean
  submitLocked?: boolean
  onShowInfo: (nomination: ReunionNomination) => void
}) {
  const [order, setOrder] = useState(initialOrder)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length || from === to) return
    setOrder((prev) => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }

  return (
    <div>
      <p className="ballot-hint">
        Drag nominations into your order of preference — #1 is your top choice. On
        touch screens, use the arrows.
      </p>
      <ol className="ballot-list">
        {order.map((id, index) => {
          const nomination = nominationsById.get(id)
          if (!nomination) return null
          return (
            <li
              key={id}
              className={`ballot-item ballot-item-draggable ${dragIndex === index ? 'dragging' : ''}`}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragEnd={() => setDragIndex(null)}
              onDragOver={(e) => {
                e.preventDefault()
                if (dragIndex !== null && dragIndex !== index) {
                  move(dragIndex, index)
                  setDragIndex(index)
                }
              }}
            >
              <span className="ballot-drag-handle" aria-hidden="true">⠿</span>
              <span className="ballot-item-name">{nomination.name}</span>
              <span className="ballot-item-location">
                {nomination.city}, {nomination.state}
              </span>
              <span className="ballot-item-arrows">
                <InfoButton nomination={nomination} onShowInfo={onShowInfo} />
                <button
                  type="button"
                  className="ballot-arrow"
                  onClick={() => move(index, index - 1)}
                  disabled={index === 0}
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="ballot-arrow"
                  onClick={() => move(index, index + 1)}
                  disabled={index === order.length - 1}
                  aria-label="Move down"
                >
                  ↓
                </button>
              </span>
            </li>
          )
        })}
      </ol>
      <div className="ballot-actions">
        <button
          type="button"
          className="ballot-primary-button"
          onClick={() => onSubmit(order)}
          disabled={submitting || submitLocked}
        >
          {submitLocked ? 'Submitting opens when nominations close' : submitting ? 'Submitting…' : 'Submit Vote'}
        </button>
        <button type="button" className="ballot-secondary-button" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
      </div>
    </div>
  )
}

export function VotingPanel({
  user,
  reunion,
  nominations,
  isLoadingNominations,
  nominationsCloseAt,
}: VotingPanelProps) {
  const [mode, setMode] = useState<Mode>('view')
  const [pendingOrder, setPendingOrder] = useState<string[]>([])
  const [manualStart, setManualStart] = useState<string[] | null>(null)
  const [infoNomination, setInfoNomination] = useState<ReunionNomination | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const reunionId = reunion.reunionId!
  const votingClosed =
    reunion.votingDeadline !== undefined && new Date() >= reunion.votingDeadline
  const submitLocked = nominationsCloseAt !== undefined

  const { data: vote, isLoading: voteLoading } = useQuery({
    queryKey: ['vote', reunionId, user.id],
    queryFn: () => getMyVote(user.id, reunionId),
  })

  const nominationsById = new Map(
    nominations.map((n) => [n.reunionNominationId!, n]),
  )

  // The saved ballot may reference deleted nominations, and new nominations
  // may exist that the ballot hasn't ranked: drop the former, append the latter
  const normalizeOrder = (savedOrder: string[]): string[] => {
    const kept = savedOrder.filter((id) => nominationsById.has(id))
    const missing = nominations
      .map((n) => n.reunionNominationId!)
      .filter((id) => !kept.includes(id))
    return [...kept, ...missing]
  }

  const submitBallot = async (order: string[]) => {
    setSubmitting(true)
    setError(null)
    try {
      const saved = await saveVote(user.id, reunionId, order)
      queryClient.setQueryData(['vote', reunionId, user.id], saved)
      setMode('view')
    } catch {
      setError('Could not submit your vote. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoadingNominations || voteLoading) {
    return <p>Loading…</p>
  }

  if (nominations.length === 0) {
    return <p>There are no nominations to vote on yet.</p>
  }

  const votedOrder = vote ? normalizeOrder(vote.rankedNominationIds) : null

  return (
    <div className="voting-panel">
      {error && <p className="ballot-error">{error}</p>}

      {submitLocked && (
        <p className="ballot-locked-notice">
          Nominations are open until {nominationsCloseAt.toLocaleDateString()} — you can try
          out the ballot builder now, but votes can't be submitted until nominations close
          (more may still be added).
        </p>
      )}

      {mode === 'view' && votedOrder && (
        <div>
          <p className="ballot-hint">Your ballot, from most to least preferred:</p>
          <BallotList order={votedOrder} nominationsById={nominationsById} onShowInfo={setInfoNomination} />
          {votingClosed ? (
            <p className="ballot-hint">
              Voting closed on {reunion.votingDeadline!.toLocaleDateString()}, so your ballot
              can no longer be changed.
            </p>
          ) : (
            <button type="button" className="ballot-primary-button" onClick={() => setMode('choose')}>
              Edit Vote
            </button>
          )}
        </div>
      )}

      {mode === 'view' && !votedOrder && (
        votingClosed ? (
          <p>
            Voting closed on {reunion.votingDeadline!.toLocaleDateString()} and you did not
            submit a ballot.
          </p>
        ) : (
          <div>
            <p className="ballot-hint">
              Rank the {nominations.length} nomination{nominations.length !== 1 ? 's' : ''} to
              cast your vote. You can submit one ballot and edit it any time until voting closes.
            </p>
            <button type="button" className="ballot-primary-button" onClick={() => setMode('choose')}>
              {submitLocked ? 'Try the Ballot Builder' : 'Start Voting'}
            </button>
          </div>
        )
      )}

      {mode === 'choose' && (
        <div>
          <p className="ballot-hint">How would you like to build your ballot?</p>
          <div className="ballot-method-options">
            <button type="button" className="ballot-method-card" onClick={() => setMode('bob')}>
              <strong>Use B.O.B</strong>
              <span>
                B.O.B (Ballot Organizing Bob) asks simple this-or-that questions and builds the
                ranking for you
              </span>
            </button>
            <button
              type="button"
              className="ballot-method-card"
              onClick={() => {
                setManualStart(votedOrder ?? nominations.map((n) => n.reunionNominationId!))
                setMode('manual')
              }}
            >
              <strong>Order manually</strong>
              <span>Drag the full list into your preferred order</span>
            </button>
          </div>
          <button type="button" className="ballot-secondary-button" onClick={() => setMode('view')}>
            Back
          </button>
        </div>
      )}

      {mode === 'manual' && (
        <BallotEditor
          initialOrder={manualStart ?? votedOrder ?? nominations.map((n) => n.reunionNominationId!)}
          nominationsById={nominationsById}
          onSubmit={submitBallot}
          onCancel={() => setMode('choose')}
          submitting={submitting}
          submitLocked={submitLocked}
          onShowInfo={setInfoNomination}
        />
      )}

      {mode === 'bob' && (
        <BobRanker
          nominations={nominations}
          storageKey={`arlene:bob:${reunionId}:${user.id}`}
          onComplete={(rankedIds) => {
            setPendingOrder(rankedIds)
            setMode('confirm')
          }}
          onCancel={() => setMode('choose')}
          onShowInfo={setInfoNomination}
        />
      )}

      {mode === 'confirm' && (
        <div>
          <p className="ballot-hint">
            B.O.B finished! Here's your ranking — confirm it or fine-tune it before submitting.
          </p>
          <BallotList order={pendingOrder} nominationsById={nominationsById} onShowInfo={setInfoNomination} />
          <div className="ballot-actions">
            <button
              type="button"
              className="ballot-primary-button"
              onClick={() => submitBallot(pendingOrder)}
              disabled={submitting || submitLocked}
            >
              {submitLocked
                ? 'Submitting opens when nominations close'
                : submitting
                  ? 'Submitting…'
                  : 'Submit Vote'}
            </button>
            <button
              type="button"
              className="ballot-secondary-button"
              onClick={() => {
                setManualStart(pendingOrder)
                setMode('manual')
              }}
              disabled={submitting}
            >
              Adjust manually
            </button>
            <button
              type="button"
              className="ballot-secondary-button"
              onClick={() => setMode('view')}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {infoNomination && (
        <NominationInfoDialog nomination={infoNomination} onClose={() => setInfoNomination(null)} />
      )}
    </div>
  )
}

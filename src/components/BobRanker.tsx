import { useEffect, useMemo, useState } from 'react'
import type { ReunionNomination } from '../types/ReunionNomination'
import './VotingPanel.css'

// B.O.B (Ballot Organizing Bob): produces a full ranking by asking pairwise
// "this or that" questions, using binary insertion sort so no more
// comparisons are asked than necessary and no answer is ever redundant.

type BobState = {
  // Insertion order, shuffled at the start so it doesn't bias early questions
  shuffled: string[]
  // Ranking built so far, index 0 = most preferred
  ranked: string[]
  // Index into `shuffled` of the nominee currently being inserted
  nextIndex: number
  // Binary search bounds (hi exclusive) within `ranked` for the current nominee
  lo: number
  hi: number
  // Snapshots before each answer, for undo
  history: Array<{ ranked: string[]; nextIndex: number; lo: number; hi: number }>
}

type BobRankerProps = {
  nominations: ReunionNomination[]
  // Namespaced per reunion + user so an in-progress session can resume
  storageKey: string
  onComplete: (rankedIds: string[]) => void
  onCancel: () => void
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// Inserting nominee k+1 into a ranked list of k takes at most ceil(log2(k+1))
// questions, so the estimated total is the sum over every insertion
function estimateTotalQuestions(n: number): number {
  let total = 0
  for (let k = 1; k < n; k++) total += Math.ceil(Math.log2(k + 1))
  return total
}

function freshState(ids: string[]): BobState {
  const shuffled = shuffle(ids)
  return {
    shuffled,
    ranked: shuffled.slice(0, 1),
    nextIndex: 1,
    lo: 0,
    hi: 1,
    history: [],
  }
}

function loadState(storageKey: string, ids: string[]): BobState {
  try {
    const raw = localStorage.getItem(storageKey)
    if (raw) {
      const saved: BobState = JSON.parse(raw)
      // Only resume if the nomination set is unchanged
      const savedIds = [...saved.shuffled].sort()
      const currentIds = [...ids].sort()
      if (savedIds.length === currentIds.length && savedIds.every((id, i) => id === currentIds[i])) {
        return saved
      }
    }
  } catch {
    // Corrupt saved state — start over
  }
  return freshState(ids)
}

export function BobRanker({ nominations, storageKey, onComplete, onCancel }: BobRankerProps) {
  const ids = useMemo(() => nominations.map((n) => n.reunionNominationId!), [nominations])
  const byId = useMemo(
    () => new Map(nominations.map((n) => [n.reunionNominationId!, n])),
    [nominations],
  )

  const [state, setState] = useState<BobState>(() => loadState(storageKey, ids))
  // Which side the candidate appears on, re-rolled per question to avoid
  // position bias (but stable across re-renders of the same question)
  const [candidateFirst, setCandidateFirst] = useState(() => Math.random() < 0.5)

  const done = state.nextIndex >= state.shuffled.length

  // Persist after every answer so the user can resume mid-process
  useEffect(() => {
    if (!done) {
      localStorage.setItem(storageKey, JSON.stringify(state))
    }
  }, [state, done, storageKey])

  useEffect(() => {
    if (done) {
      localStorage.removeItem(storageKey)
      onComplete(state.ranked)
    }
  }, [done, state.ranked, storageKey, onComplete])

  if (done) return null

  const candidateId = state.shuffled[state.nextIndex]
  const mid = Math.floor((state.lo + state.hi) / 2)
  const opponentId = state.ranked[mid]
  const candidate = byId.get(candidateId)
  const opponent = byId.get(opponentId)

  const answer = (preferCandidate: boolean) => {
    setState((prev) => {
      const snapshot = {
        ranked: prev.ranked,
        nextIndex: prev.nextIndex,
        lo: prev.lo,
        hi: prev.hi,
      }
      const m = Math.floor((prev.lo + prev.hi) / 2)
      // Preferring the candidate means it ranks above the midpoint
      let lo = preferCandidate ? prev.lo : m + 1
      let hi = preferCandidate ? m : prev.hi
      let ranked = prev.ranked
      let nextIndex = prev.nextIndex

      if (lo === hi) {
        // Search range is empty: insert here and move to the next nominee
        ranked = [...ranked.slice(0, lo), prev.shuffled[nextIndex], ...ranked.slice(lo)]
        nextIndex += 1
        lo = 0
        hi = ranked.length
      }

      return { ...prev, ranked, nextIndex, lo, hi, history: [...prev.history, snapshot] }
    })
    setCandidateFirst(Math.random() < 0.5)
  }

  const undo = () => {
    setState((prev) => {
      if (prev.history.length === 0) return prev
      const last = prev.history[prev.history.length - 1]
      return { ...prev, ...last, history: prev.history.slice(0, -1) }
    })
    setCandidateFirst(Math.random() < 0.5)
  }

  const startOver = () => {
    localStorage.removeItem(storageKey)
    setState(freshState(ids))
    setCandidateFirst(Math.random() < 0.5)
  }

  const questionNumber = state.history.length + 1
  const estimatedTotal = estimateTotalQuestions(ids.length)

  const options = [
    { id: candidateId, nomination: candidate, prefersCandidate: true },
    { id: opponentId, nomination: opponent, prefersCandidate: false },
  ]
  if (!candidateFirst) options.reverse()

  return (
    <div className="bob-ranker">
      <p className="bob-intro">
        B.O.B will build your ballot from a few this-or-that questions.
      </p>
      <p className="bob-progress">
        Question {questionNumber} of ~{estimatedTotal} · {state.ranked.length} of{' '}
        {ids.length} nominations ranked
      </p>

      <h3 className="bob-question">Which do you prefer?</h3>
      <div className="bob-options">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className="bob-option"
            onClick={() => answer(option.prefersCandidate)}
          >
            <span className="bob-option-name">{option.nomination?.name ?? 'Unknown'}</span>
            <span className="bob-option-location">
              {option.nomination ? `${option.nomination.city}, ${option.nomination.state}` : ''}
            </span>
          </button>
        ))}
      </div>

      <div className="bob-controls">
        <button
          type="button"
          className="ballot-secondary-button"
          onClick={undo}
          disabled={state.history.length === 0}
        >
          Undo last answer
        </button>
        <button type="button" className="ballot-secondary-button" onClick={startOver}>
          Start over
        </button>
        <button type="button" className="ballot-secondary-button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}

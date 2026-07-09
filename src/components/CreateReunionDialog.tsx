import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import './CreateReunionDialog.css'

type CreateReunionDialogProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (formData: CreateReunionFormData) => void
  // Prefill for editing an existing reunion; pass a stable (memoized) object
  initialValues?: CreateReunionFormData
  title?: string
  submitLabel?: string
}

export type CreateReunionFormData = {
  name: string
  description?: string
  reunionStartDate?: string
  reunionEndDate?: string
  // "YYYY-MM-DD"; the deadline is 00:00:00 at the start of that day
  nominationDeadline?: string
  votingDeadline?: string
}

export function CreateReunionDialog({
  isOpen,
  onClose,
  onSubmit,
  initialValues,
  title = 'Create a New Reunion',
  submitLabel = 'Create Reunion',
}: CreateReunionDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [reunionStartDate, setReunionStartDate] = useState('')
  const [reunionEndDate, setReunionEndDate] = useState('')
  const [nominationDeadline, setNominationDeadline] = useState('')
  const [votingDeadline, setVotingDeadline] = useState('')

  // Reset the fields each time the dialog opens so edits always start
  // from the current values
  useEffect(() => {
    if (isOpen) {
      setName(initialValues?.name ?? '')
      setDescription(initialValues?.description ?? '')
      setReunionStartDate(initialValues?.reunionStartDate ?? '')
      setReunionEndDate(initialValues?.reunionEndDate ?? '')
      setNominationDeadline(initialValues?.nominationDeadline ?? '')
      setVotingDeadline(initialValues?.votingDeadline ?? '')
    }
  }, [isOpen, initialValues])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit({
      name,
      description: description || undefined,
      reunionStartDate: reunionStartDate || undefined,
      reunionEndDate: reunionEndDate || undefined,
      nominationDeadline: nominationDeadline || undefined,
      votingDeadline: votingDeadline || undefined,
    })
  }

  if (!isOpen) return null

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>{title}</h2>
          <button type="button" className="dialog-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form className="reunion-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Reunion Name *</label>
            <input
              id="name"
              type="text"
              required
              placeholder="e.g., Summer 2024 Reunion"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              placeholder="Optional description of the reunion"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">Start Date</label>
              <input
                id="startDate"
                type="datetime-local"
                value={reunionStartDate}
                onChange={(e) => setReunionStartDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="endDate">End Date</label>
              <input
                id="endDate"
                type="datetime-local"
                value={reunionEndDate}
                onChange={(e) => setReunionEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nominationDeadline">Nomination Deadline</label>
              <input
                id="nominationDeadline"
                type="date"
                value={nominationDeadline}
                onChange={(e) => setNominationDeadline(e.target.value)}
              />
              <small className="form-hint">Submissions close at the start of this day</small>
            </div>

            <div className="form-group">
              <label htmlFor="votingDeadline">Voting Deadline</label>
              <input
                id="votingDeadline"
                type="date"
                value={votingDeadline}
                onChange={(e) => setVotingDeadline(e.target.value)}
              />
              <small className="form-hint">Voting closes at the start of this day</small>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

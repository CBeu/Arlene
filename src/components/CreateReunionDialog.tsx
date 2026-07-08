import { useState } from 'react'
import type { FormEvent } from 'react'
import './CreateReunionDialog.css'

type CreateReunionDialogProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (formData: CreateReunionFormData) => void
}

export type CreateReunionFormData = {
  name: string
  description?: string
  reunionStartDate?: string
  reunionEndDate?: string
}

export function CreateReunionDialog({ isOpen, onClose, onSubmit }: CreateReunionDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [reunionStartDate, setReunionStartDate] = useState('')
  const [reunionEndDate, setReunionEndDate] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit({
      name,
      description: description || undefined,
      reunionStartDate: reunionStartDate || undefined,
      reunionEndDate: reunionEndDate || undefined,
    })
    setName('')
    setDescription('')
    setReunionStartDate('')
    setReunionEndDate('')
  }

  if (!isOpen) return null

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>Create a New Reunion</h2>
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

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              Create Reunion
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

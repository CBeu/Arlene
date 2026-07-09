import { useState } from 'react'
import type { CreateNominationInput } from '../lib/nominationService'
import './SubmitNominationForm.css'

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC'
]

const EMPTY_FORM: CreateNominationInput = {
  name: '',
  description: '',
  city: '',
  state: '',
  url: '',
}

type SubmitNominationFormProps = {
  onSubmit: (data: CreateNominationInput) => Promise<void>
  isLoading?: boolean
  error?: string | null
  // Prefill for editing an existing nomination
  initialValues?: CreateNominationInput
  submitLabel?: string
  loadingLabel?: string
}

export function SubmitNominationForm({
  onSubmit,
  isLoading = false,
  error: externalError,
  initialValues,
  submitLabel = 'Submit Nomination',
  loadingLabel = 'Submitting...',
}: SubmitNominationFormProps) {
  const [formData, setFormData] = useState<CreateNominationInput>(initialValues ?? EMPTY_FORM)
  const [error, setError] = useState<string | null>(externalError || null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value === '' ? (name.startsWith('bedroom') || name.startsWith('bathroom') || name.startsWith('capacity') || name.startsWith('unit') || name.startsWith('price') ? undefined : value) : name.startsWith('bedroom') || name.startsWith('bathroom') || name.startsWith('capacity') || name.startsWith('unit') || name.startsWith('price') ? parseInt(value, 10) || undefined : value,
    }))
  }

  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const numValue = value === '' ? undefined : parseInt(value, 10)
    setFormData((prev) => ({
      ...prev,
      [name]: numValue,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate required fields
    if (!formData.name.trim() || !formData.description.trim() || !formData.city.trim() || !formData.state.trim() || !formData.url.trim()) {
      setError('Please fill in all required fields')
      return
    }

    try {
      await onSubmit(formData)
      if (!initialValues) {
        setFormData(EMPTY_FORM)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit nomination')
    }
  }

  return (
    <form className="submit-nomination-form" onSubmit={handleSubmit}>
      <div className="form-section">

        <div className="form-group">
          <label htmlFor="name">Name *</label>
          <input
            id="name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Name"
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the listing and why you're nominating it"
            rows={4}
            disabled={isLoading}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="city">City *</label>
            <input
              id="city"
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="City"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="state">State *</label>
            <select
              id="state"
              name="state"
              value={formData.state}
              onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
              disabled={isLoading}
            >
              <option value="">Select a state</option>
              {US_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="url">Website URL *</label>
          <input
            id="url"
            type="url"
            name="url"
            value={formData.url}
            onChange={handleChange}
            placeholder="https://example.com"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="form-section">
        <h3>Optional Details</h3>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="bedrooms">Bedrooms</label>
            <input
              id="bedrooms"
              type="number"
              name="bedrooms"
              value={formData.bedrooms ?? ''}
              onChange={handleNumericChange}
              placeholder="Number of bedrooms"
              disabled={isLoading}
              min="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="bathrooms">Bathrooms</label>
            <input
              id="bathrooms"
              type="number"
              name="bathrooms"
              value={formData.bathrooms ?? ''}
              onChange={handleNumericChange}
              placeholder="Number of bathrooms"
              disabled={isLoading}
              min="0"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="capacity">Capacity</label>
            <input
              id="capacity"
              type="number"
              name="capacity"
              value={formData.capacity ?? ''}
              onChange={handleNumericChange}
              placeholder="Guest capacity"
              disabled={isLoading}
              min="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="units">Units</label>
            <input
              id="units"
              type="number"
              name="units"
              value={formData.units ?? ''}
              onChange={handleNumericChange}
              placeholder="Number of units"
              disabled={isLoading}
              min="0"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="price">Price</label>
          <input
            id="price"
            type="number"
            name="price"
            value={formData.price ?? ''}
            onChange={handleNumericChange}
            placeholder="Price per night or total"
            disabled={isLoading}
            min="0"
          />
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      <button type="submit" className="form-submit-button" disabled={isLoading}>
        {isLoading ? loadingLabel : submitLabel}
      </button>
    </form>
  )
}

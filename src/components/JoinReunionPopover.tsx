import { useState, useRef, useEffect } from 'react'
import './JoinReunionPopover.css'

type JoinReunionPopoverProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (reunionId: string) => Promise<void>
}

export function JoinReunionPopover({ isOpen, onClose, onSubmit }: JoinReunionPopoverProps) {
  const [reunionId, setReunionId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setReunionId('')
      setError(null)
      setIsLoading(false)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reunionId.trim()) {
      setError('Please enter a reunion ID')
      return
    }

    try {
      setError(null)
      setIsLoading(true)
      await onSubmit(reunionId)
      setReunionId('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join reunion')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="join-reunion-overlay" onClick={onClose} />
      <div className="join-reunion-popover">
        <h2>Join a Reunion</h2>
        <p>Enter the reunion ID to join an existing reunion</p>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Reunion ID"
            value={reunionId}
            onChange={(e) => setReunionId(e.target.value)}
            disabled={isLoading}
          />
          {error && <p className="popover-error">{error}</p>}

          <div className="popover-actions">
            <button type="button" className="popover-cancel" onClick={onClose} disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className="popover-submit" disabled={isLoading}>
              {isLoading ? 'Joining...' : 'Join Reunion'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

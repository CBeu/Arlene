import { useState } from 'react'
import type { ReunionNomination } from '../types/ReunionNomination'
import { NominationsMap } from './NominationsMap'
import './ViewNominationsPanel.css'

type ViewNominationsPanelProps = {
  nominations: ReunionNomination[]
  isLoading?: boolean
  error?: string | null
  onNominationClick?: (nomination: ReunionNomination) => void
}

export function ViewNominationsPanel({
  nominations,
  isLoading = false,
  error,
  onNominationClick,
}: ViewNominationsPanelProps) {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)

  if (error) {
    return <div className="nominations-error">{error}</div>
  }

  if (isLoading) {
    return <p className="loading-message">Loading nominations...</p>
  }

  if (nominations.length === 0) {
    return <p className="empty-message">No nominations yet. Be the first to submit one!</p>
  }

  // Filter nominations by selected location if one is chosen
  const filteredNominations = selectedLocation
    ? nominations.filter((n) => `${n.city}, ${n.state}` === selectedLocation)
    : nominations

  return (
    <div className="nominations-panel">
      <NominationsMap
        nominations={nominations}
        selectedLocation={selectedLocation}
        onLocationSelect={(location) =>
          setSelectedLocation(selectedLocation === location ? null : location)
        }
      />

      <div className="nominations-list-section">
        {selectedLocation && (
          <div className="location-filter-info">
            Showing nominations for: <strong>{selectedLocation}</strong>
            <button
              type="button"
              className="clear-filter-btn"
              onClick={() => setSelectedLocation(null)}
            >
              Clear filter
            </button>
          </div>
        )}

        <div className="nominations-grid">
          {filteredNominations.map((nomination) => (
            <button
              key={nomination.reunionNominationId}
              type="button"
              className="nomination-card"
              onClick={() => onNominationClick?.(nomination)}
            >
              <h3 className="nomination-name">{nomination.name}</h3>
              <p className="nomination-location">
                {nomination.city}, {nomination.state}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

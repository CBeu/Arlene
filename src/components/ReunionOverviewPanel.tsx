import { useEffect, useState } from 'react'
import { getReunionMembers, type ReunionMember } from '../lib/reunionService'
import type { Reunion } from '../types/Reunion'
import './ReunionOverviewPanel.css'

type ReunionOverviewPanelProps = {
  reunion: Reunion
}

function formatDates(reunion: Reunion): string {
  const { reunionStartDate, reunionEndDate } = reunion
  if (reunionStartDate && reunionEndDate) {
    return `${reunionStartDate.toLocaleDateString()} - ${reunionEndDate.toLocaleDateString()}`
  }
  if (reunionStartDate) return `Starts ${reunionStartDate.toLocaleDateString()}`
  if (reunionEndDate) return `Ends ${reunionEndDate.toLocaleDateString()}`
  return 'No dates set'
}

export function ReunionOverviewPanel({ reunion }: ReunionOverviewPanelProps) {
  const [members, setMembers] = useState<ReunionMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getReunionMembers(reunion.reunionId!)
        setMembers(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch members')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMembers()
  }, [reunion.reunionId])

  return (
    <div className="reunion-overview">
      <h2>{reunion.name}</h2>
      <p className="reunion-overview-dates">{formatDates(reunion)}</p>
      {reunion.nominationDeadline && (
        <p className="reunion-overview-deadline">
          Nominations {new Date() >= reunion.nominationDeadline ? 'closed' : 'close'} at the start of{' '}
          {reunion.nominationDeadline.toLocaleDateString()}
        </p>
      )}
      {reunion.votingDeadline && (
        <p className="reunion-overview-deadline">
          Voting {new Date() >= reunion.votingDeadline ? 'closed' : 'closes'} at the start of{' '}
          {reunion.votingDeadline.toLocaleDateString()}
        </p>
      )}
      {reunion.description && <p className="reunion-overview-description">{reunion.description}</p>}

      <div className="reunion-members">
        <h3>Members</h3>
        {error && <p className="reunion-members-error">{error}</p>}
        {isLoading ? (
          <p className="reunion-members-loading">Loading members...</p>
        ) : (
          <ul className="reunion-members-list">
            {members.map((member) => (
              <li key={member.profileId}>{member.displayName}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

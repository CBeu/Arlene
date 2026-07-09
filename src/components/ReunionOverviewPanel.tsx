import { useQuery } from '@tanstack/react-query'
import { getReunionMembers } from '../lib/reunionService'
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
  const {
    data: members = [],
    isLoading,
    error: fetchError,
  } = useQuery({
    queryKey: ['members', reunion.reunionId],
    queryFn: () => getReunionMembers(reunion.reunionId!),
  })
  const error = fetchError
    ? fetchError instanceof Error
      ? fetchError.message
      : 'Failed to fetch members'
    : null

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

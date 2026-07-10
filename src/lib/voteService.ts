import { supabase } from './supabaseClient'

export type ReunionVote = {
  voteId: string
  reunionId: string
  profileId: string
  rankedNominationIds: string[]
}

function rowToVote(row: any): ReunionVote {
  return {
    voteId: row.id,
    reunionId: row.reunion_id,
    profileId: row.profile_id,
    rankedNominationIds: row.ranked_nomination_ids ?? [],
  }
}

// Fetch the current user's ballot for a reunion, or null if not yet voted
export async function getMyVote(userId: string, reunionId: string): Promise<ReunionVote | null> {
  const { data, error } = await supabase
    .from('reunion_votes')
    .select('*')
    .eq('reunion_id', reunionId)
    .eq('profile_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching vote:', error)
    throw error
  }

  return data ? rowToVote(data) : null
}

// Create or replace the user's ballot (one row per user per reunion)
export async function saveVote(
  userId: string,
  reunionId: string,
  rankedNominationIds: string[],
): Promise<ReunionVote> {
  const { data, error } = await supabase
    .from('reunion_votes')
    .upsert(
      {
        reunion_id: reunionId,
        profile_id: userId,
        ranked_nomination_ids: rankedNominationIds,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'reunion_id,profile_id' },
    )
    .select()
    .single()

  if (error) {
    console.error('Error saving vote:', error)
    throw error
  }

  return rowToVote(data)
}

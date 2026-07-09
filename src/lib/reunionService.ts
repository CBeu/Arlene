import { supabase } from './supabaseClient'
import { Reunion } from '../types/Reunion'

export type CreateReunionInput = {
  name: string
  description?: string
  reunionStartDate?: string
  reunionEndDate?: string
  // "YYYY-MM-DD" from a date input; the deadline is the start of that day
  nominationDeadline?: string
  votingDeadline?: string
}

// Deadlines mark the start of a day: "2026-07-10" means 00:00:00 local
// time on 7/10, stored as an absolute timestamp
function dateInputToIso(value?: string): string | null {
  if (!value) return null
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day).toISOString()
}

function rowToReunion(row: any, members: string[] = []): Reunion {
  return new Reunion(
    row.name,
    new Date(row.created_at),
    row.created_by_uuid,
    members,
    [], // nominations array not populated here
    row.description ?? undefined,
    row.reunion_start_date ? new Date(row.reunion_start_date) : undefined,
    row.reunion_end_date ? new Date(row.reunion_end_date) : undefined,
    row.id,
    row.nomination_deadline ? new Date(row.nomination_deadline) : undefined,
    row.voting_deadline ? new Date(row.voting_deadline) : undefined,
  )
}

// Retrieve all reunions a user is a member of
export async function getUserReunions(userId: string): Promise<Reunion[]> {
  // First get all reunion IDs the user is a member of
  const { data: membershipData, error: membershipError } = await supabase
    .from('profile_reunions')
    .select('reunion_id')
    .eq('profile_id', userId)

  if (membershipError) {
    console.error('Error fetching user memberships:', membershipError)
    throw membershipError
  }

  if (!membershipData || membershipData.length === 0) {
    return []
  }

  const reunionIds = membershipData.map((m) => m.reunion_id)

  // Then fetch the reunion details
  const { data, error } = await supabase
    .from('reunions')
    .select('*')
    .in('id', reunionIds)

  if (error) {
    console.error('Error fetching user reunions:', error)
    throw error
  }

  return (data || []).map((row) => rowToReunion(row))
}

// Create a new reunion and add the creator as a member
export async function createReunion(userId: string, input: CreateReunionInput): Promise<Reunion> {
  // Create the reunion
  const { data: reunionData, error: reunionError } = await supabase
    .from('reunions')
    .insert([
      {
        name: input.name,
        description: input.description || null,
        created_by_uuid: userId,
        reunion_start_date: input.reunionStartDate || null,
        reunion_end_date: input.reunionEndDate || null,
        nomination_deadline: dateInputToIso(input.nominationDeadline),
        voting_deadline: dateInputToIso(input.votingDeadline),
      },
    ])
    .select()
    .single()

  if (reunionError) {
    console.error('Error creating reunion:', reunionError)
    throw reunionError
  }

  // Add the creator as a member
  const { error: memberError } = await supabase.from('profile_reunions').insert([
    {
      profile_id: userId,
      reunion_id: reunionData.id,
    },
  ])

  if (memberError) {
    console.error('Error adding creator to reunion:', memberError)
    throw memberError
  }

  return rowToReunion(reunionData, [userId])
}

// Update a reunion (RLS only allows the creator)
export async function updateReunion(reunionId: string, input: CreateReunionInput): Promise<Reunion> {
  const { data, error } = await supabase
    .from('reunions')
    .update({
      name: input.name,
      description: input.description || null,
      reunion_start_date: input.reunionStartDate || null,
      reunion_end_date: input.reunionEndDate || null,
      nomination_deadline: dateInputToIso(input.nominationDeadline),
      voting_deadline: dateInputToIso(input.votingDeadline),
    })
    .eq('id', reunionId)
    .select()
    .single()

  if (error) {
    console.error('Error updating reunion:', error)
    throw error
  }

  return rowToReunion(data)
}

// Delete a reunion (RLS only allows the creator); nominations, comments,
// and memberships cascade with it
export async function deleteReunion(reunionId: string): Promise<void> {
  const { error } = await supabase
    .from('reunions')
    .delete()
    .eq('id', reunionId)

  if (error) {
    console.error('Error deleting reunion:', error)
    throw error
  }
}

// Check if user is already a member of a reunion
export async function isUserMemberOfReunion(userId: string, reunionId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profile_reunions')
    .select('id')
    .eq('profile_id', userId)
    .eq('reunion_id', reunionId)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 is "no rows found" - that's expected if not a member
    console.error('Error checking membership:', error)
    throw error
  }

  return !!data
}

// Add a user to a reunion
export async function addUserToReunion(userId: string, reunionId: string): Promise<void> {
  // Check if reunion exists first
  const { data: reunionData, error: reunionError } = await supabase
    .from('reunions')
    .select('id')
    .eq('id', reunionId)
    .single()

  if (reunionError || !reunionData) {
    throw new Error('Reunion not found')
  }

  // Check if already a member
  const isMember = await isUserMemberOfReunion(userId, reunionId)
  if (isMember) {
    throw new Error('You are already a member of this reunion')
  }

  const { error } = await supabase.from('profile_reunions').insert([
    {
      profile_id: userId,
      reunion_id: reunionId,
    },
  ])

  if (error) {
    console.error('Error adding user to reunion:', error)
    throw error
  }
}

// Fetch a single reunion by id
export async function getReunionById(reunionId: string): Promise<Reunion> {
  const { data, error } = await supabase
    .from('reunions')
    .select('*')
    .eq('id', reunionId)
    .single()

  if (error || !data) {
    throw new Error('Reunion not found')
  }

  return rowToReunion(data)
}

export type ReunionMember = {
  profileId: string
  displayName: string
}

// Fetch the profiles of everyone who is a member of a reunion
export async function getReunionMembers(reunionId: string): Promise<ReunionMember[]> {
  const { data, error } = await supabase
    .from('profile_reunions')
    .select('profile_id, profiles(display_name, email)')
    .eq('reunion_id', reunionId)

  if (error) {
    console.error('Error fetching reunion members:', error)
    throw error
  }

  return (data || []).map((row) => {
    const profile = row.profiles as unknown as { display_name: string | null; email: string | null } | null
    return {
      profileId: row.profile_id,
      displayName: profile?.display_name || profile?.email || 'Unknown member',
    }
  })
}

// Join a reunion via an invite link. Unlike addUserToReunion, this is
// idempotent: if the user is already a member it just returns the reunion.
export async function joinReunion(userId: string, reunionId: string): Promise<Reunion> {
  const reunion = await getReunionById(reunionId)

  const isMember = await isUserMemberOfReunion(userId, reunionId)
  if (!isMember) {
    const { error } = await supabase.from('profile_reunions').insert([
      {
        profile_id: userId,
        reunion_id: reunionId,
      },
    ])

    if (error) {
      console.error('Error joining reunion:', error)
      throw error
    }
  }

  return reunion
}

// Shareable invite link that auto-joins the reunion when opened
export function getJoinLink(reunionId: string): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}?join=${reunionId}`
}

// Remove a user from a reunion
export async function removeUserFromReunion(userId: string, reunionId: string): Promise<void> {
  const { error } = await supabase
    .from('profile_reunions')
    .delete()
    .eq('profile_id', userId)
    .eq('reunion_id', reunionId)

  if (error) {
    console.error('Error removing user from reunion:', error)
    throw error
  }
}

import { supabase } from './supabaseClient'
import { Reunion } from '../types/Reunion'

export type CreateReunionInput = {
  name: string
  description?: string
  reunionStartDate?: string
  reunionEndDate?: string
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

  return (data || []).map(
    (row) =>
      new Reunion(
        row.name,
        new Date(row.created_at),
        row.created_by_uuid,
        [], // members array not populated here
        [], // nominations array not populated here
        row.description,
        row.reunion_start_date ? new Date(row.reunion_start_date) : undefined,
        row.reunion_end_date ? new Date(row.reunion_end_date) : undefined,
        row.id, // reunionId
      ),
  )
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

  return new Reunion(
    reunionData.name,
    new Date(reunionData.created_at),
    reunionData.created_by_uuid,
    [userId], // members
    [], // nominations
    reunionData.description ?? undefined,
    reunionData.reunion_start_date ? new Date(reunionData.reunion_start_date) : undefined,
    reunionData.reunion_end_date ? new Date(reunionData.reunion_end_date) : undefined,
    reunionData.id, // reunionId
  )
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

  return new Reunion(
    data.name,
    new Date(data.created_at),
    data.created_by_uuid,
    [], // members array not populated here
    [], // nominations array not populated here
    data.description ?? undefined,
    data.reunion_start_date ? new Date(data.reunion_start_date) : undefined,
    data.reunion_end_date ? new Date(data.reunion_end_date) : undefined,
    data.id,
  )
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

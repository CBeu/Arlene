import { supabase } from './supabaseClient'
import { NominationComment } from '../types/NominationComment'

function rowToComment(row: any): NominationComment {
  const profile = row.profiles as { display_name: string | null; email: string | null } | null
  return new NominationComment(
    row.id,
    row.nomination_id,
    row.created_by_uuid,
    profile?.display_name || profile?.email || 'Unknown member',
    row.comment,
    row.created_at,
  )
}

// Retrieve all comments for a nomination, oldest first
export async function getNominationComments(nominationId: string): Promise<NominationComment[]> {
  const { data, error } = await supabase
    .from('nomination_comments')
    .select('*, profiles(display_name, email)')
    .eq('nomination_id', nominationId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching comments:', error)
    throw error
  }

  return (data || []).map(rowToComment)
}

// Add a comment to a nomination
export async function createComment(
  userId: string,
  nominationId: string,
  comment: string,
): Promise<NominationComment> {
  const { data, error } = await supabase
    .from('nomination_comments')
    .insert([
      {
        nomination_id: nominationId,
        created_by_uuid: userId,
        comment,
      },
    ])
    .select('*, profiles(display_name, email)')
    .single()

  if (error) {
    console.error('Error creating comment:', error)
    throw error
  }

  return rowToComment(data)
}

// Delete a comment (RLS only allows deleting your own)
export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase
    .from('nomination_comments')
    .delete()
    .eq('id', commentId)

  if (error) {
    console.error('Error deleting comment:', error)
    throw error
  }
}

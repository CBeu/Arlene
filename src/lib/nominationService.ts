import { supabase } from './supabaseClient'
import { ReunionNomination } from '../types/ReunionNomination'

export type CreateNominationInput = {
  name: string
  description: string
  city: string
  state: string
  url: string
  bedrooms?: number
  bathrooms?: number
  capacity?: number
  units?: number
  price?: number
}

// Retrieve all nominations for a specific reunion
export async function getReunionNominations(reunionId: string): Promise<ReunionNomination[]> {
  const { data, error } = await supabase
    .from('reunion_nominations')
    .select('*')
    .eq('reunion_id', reunionId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching nominations:', error)
    throw error
  }

  return (data || []).map(
    (row) =>
      new ReunionNomination(
        row.name,
        row.description,
        row.city,
        row.state,
        row.url,
        row.created_by_uuid,
        row.bedrooms,
        row.bathrooms,
        row.capacity,
        row.units,
        row.price,
        row.id,
      ),
  )
}

// Create a new nomination
export async function createNomination(
  userId: string,
  reunionId: string,
  input: CreateNominationInput,
): Promise<ReunionNomination> {
  const { data, error } = await supabase
    .from('reunion_nominations')
    .insert([
      {
        reunion_id: reunionId,
        name: input.name,
        description: input.description,
        city: input.city,
        state: input.state,
        url: input.url,
        created_by_uuid: userId,
        bedrooms: input.bedrooms || null,
        bathrooms: input.bathrooms || null,
        capacity: input.capacity || null,
        units: input.units || null,
        price: input.price || null,
      },
    ])
    .select()
    .single()

  if (error) {
    console.error('Error creating nomination:', error)
    throw error
  }

  return new ReunionNomination(
    data.name,
    data.description,
    data.city,
    data.state,
    data.url,
    data.created_by_uuid,
    data.bedrooms,
    data.bathrooms,
    data.capacity,
    data.units,
    data.price,
    data.id,
  )
}

// Delete a nomination
export async function deleteNomination(nominationId: string): Promise<void> {
  const { error } = await supabase
    .from('reunion_nominations')
    .delete()
    .eq('id', nominationId)

  if (error) {
    console.error('Error deleting nomination:', error)
    throw error
  }
}

// Update a nomination
export async function updateNomination(
  nominationId: string,
  input: Partial<CreateNominationInput>,
): Promise<ReunionNomination> {
  const { data, error } = await supabase
    .from('reunion_nominations')
    .update(input)
    .eq('id', nominationId)
    .select()
    .single()

  if (error) {
    console.error('Error updating nomination:', error)
    throw error
  }

  return new ReunionNomination(
    data.name,
    data.description,
    data.city,
    data.state,
    data.url,
    data.created_by_uuid,
    data.bedrooms,
    data.bathrooms,
    data.capacity,
    data.units,
    data.price,
    data.id,
  )
}

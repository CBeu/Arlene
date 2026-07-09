import { supabase } from './supabaseClient'
import { ReunionNomination } from '../types/ReunionNomination'
import { geocodeCity } from './geocodingService'

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

function rowToNomination(row: any): ReunionNomination {
  return new ReunionNomination(
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
    row.lat ?? undefined,
    row.lng ?? undefined,
  )
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

  return (data || []).map(rowToNomination)
}

// Create a new nomination
export async function createNomination(
  userId: string,
  reunionId: string,
  input: CreateNominationInput,
): Promise<ReunionNomination> {
  // Best-effort: a failed lookup stores null coordinates rather than
  // blocking the save; the map geocodes missing rows lazily.
  const coords = await geocodeCity(input.city, input.state)

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
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
      },
    ])
    .select()
    .single()

  if (error) {
    console.error('Error creating nomination:', error)
    throw error
  }

  return rowToNomination(data)
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
  const updates: Record<string, unknown> = { ...input }

  // Re-geocode when the location changes
  if (input.city !== undefined && input.state !== undefined) {
    const coords = await geocodeCity(input.city, input.state)
    updates.lat = coords?.lat ?? null
    updates.lng = coords?.lng ?? null
  }

  const { data, error } = await supabase
    .from('reunion_nominations')
    .update(updates)
    .eq('id', nominationId)
    .select()
    .single()

  if (error) {
    console.error('Error updating nomination:', error)
    throw error
  }

  return rowToNomination(data)
}

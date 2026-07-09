// Geocodes a US city + state to coordinates using the free Open-Meteo
// geocoding API (https://open-meteo.com/en/docs/geocoding-api) — no API key,
// and unlike Nominatim it sends CORS headers so it can be called directly
// from the browser. Results are cached in memory for the session; nominations
// also persist their coordinates at write time, so each city is only looked
// up once per save or per legacy row.

export type Coordinates = { lat: number; lng: number }

// Open-Meteo has no state filter parameter; results report the full state
// name in `admin1`, so we match against the abbreviation's expansion.
const US_STATES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'District of Columbia',
}

type GeocodingResult = {
  name: string
  latitude: number
  longitude: number
  country_code: string
  admin1?: string
}

const cache = new Map<string, Promise<Coordinates | null>>()

async function fetchCoordinates(city: string, state: string): Promise<Coordinates | null> {
  const stateName = US_STATES[state.trim().toUpperCase()]

  const params = new URLSearchParams({
    name: city.trim(),
    // Results are population-ranked with no state filter, so a small town
    // sharing its name with bigger cities needs a deep result list to appear.
    count: '50',
    language: 'en',
    format: 'json',
  })
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`)
  if (!response.ok) {
    throw new Error(`Geocoding request failed: ${response.status}`)
  }

  const data: { results?: GeocodingResult[] } = await response.json()
  const inState = (data.results ?? []).filter(
    (r) => r.country_code === 'US' && (!stateName || r.admin1 === stateName),
  )

  // The search is fuzzy, so prefer an exact city-name match; results are
  // population-ranked, so the first match is the most likely candidate.
  const cityLower = city.trim().toLowerCase()
  const match = inState.find((r) => r.name.toLowerCase() === cityLower) ?? inState[0]

  return match ? { lat: match.latitude, lng: match.longitude } : null
}

// Returns null when the city can't be found or the request fails —
// callers should treat coordinates as best-effort.
export async function geocodeCity(city: string, state: string): Promise<Coordinates | null> {
  const key = `${city.trim().toLowerCase()},${state.trim().toLowerCase()}`

  let lookup = cache.get(key)
  if (!lookup) {
    lookup = fetchCoordinates(city, state).catch((error) => {
      cache.delete(key)
      console.error('Error geocoding city:', error)
      return null
    })
    cache.set(key, lookup)
  }

  return lookup
}

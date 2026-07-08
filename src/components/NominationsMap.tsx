import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import type { ReunionNomination } from '../types/ReunionNomination'
import './NominationsMap.css'

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

type LocationCluster = {
  city: string
  state: string
  count: number
  nominations: ReunionNomination[]
  lat: number
  lng: number
}

type NominationsMapProps = {
  nominations: ReunionNomination[]
  selectedLocation?: string | null
  onLocationSelect?: (location: string) => void
}

// Simple geocoding mock - in production, use a real geocoding API
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'New York,NY': { lat: 40.7128, lng: -74.006 },
  'Los Angeles,CA': { lat: 34.0522, lng: -118.2437 },
  'Chicago,IL': { lat: 41.8781, lng: -87.6298 },
  'Houston,TX': { lat: 29.7604, lng: -95.3698 },
  'Phoenix,AZ': { lat: 33.4484, lng: -112.074 },
  'Miami,FL': { lat: 25.7617, lng: -80.1918 },
  'Denver,CO': { lat: 39.7392, lng: -104.9903 },
  'Seattle,WA': { lat: 47.6062, lng: -122.3321 },
  'Boston,MA': { lat: 42.3601, lng: -71.0589 },
  'Atlanta,GA': { lat: 33.749, lng: -84.388 },
  'Dallas,TX': { lat: 32.7767, lng: -96.797 },
  'San Francisco,CA': { lat: 37.7749, lng: -122.4194 },
  'Portland,OR': { lat: 45.5152, lng: -122.6784 },
  'Austin,TX': { lat: 30.2672, lng: -97.7431 },
  'Nashville,TN': { lat: 36.1627, lng: -86.7816 },
}

function getCoordinates(city: string, state: string): { lat: number; lng: number } {
  const key = `${city},${state}`
  if (CITY_COORDINATES[key]) {
    return CITY_COORDINATES[key]
  }
  // Default to center of US if not found
  return { lat: 39.8283, lng: -98.5795 }
}

export function NominationsMap({ nominations, selectedLocation, onLocationSelect }: NominationsMapProps) {
  // Group nominations by location
  const locationMap = new Map<string, LocationCluster>()

  nominations.forEach((nomination) => {
    const key = `${nomination.city}, ${nomination.state}`
    if (!locationMap.has(key)) {
      const coords = getCoordinates(nomination.city, nomination.state)
      locationMap.set(key, {
        city: nomination.city,
        state: nomination.state,
        count: 0,
        nominations: [],
        lat: coords.lat,
        lng: coords.lng,
      })
    }
    const cluster = locationMap.get(key)!
    cluster.count++
    cluster.nominations.push(nomination)
  })

  const clusters = Array.from(locationMap.values())

  if (clusters.length === 0) {
    return (
      <div className="nominations-map-container">
        <div className="map-empty">
          <p>No nomination locations yet</p>
        </div>
      </div>
    )
  }

  // Calculate map bounds
  const lats = clusters.map((c) => c.lat)
  const lngs = clusters.map((c) => c.lng)
  const center: [number, number] = [
    (Math.max(...lats) + Math.min(...lats)) / 2,
    (Math.max(...lngs) + Math.min(...lngs)) / 2,
  ]

  return (
    <div className="nominations-map-container">
      <div className="map-header">
        <h3>Nomination Locations</h3>
        <p className="map-summary">
          {clusters.length} location{clusters.length !== 1 ? 's' : ''} •{' '}
          {nominations.length} nomination{nominations.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* On mobile, one-finger drag scrolls the page instead of panning
          the map; two-finger pinch still zooms and pans. */}
      <MapContainer center={center} zoom={4} className="map-container" dragging={!L.Browser.mobile} touchZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {clusters.map((cluster) => {
          const locationKey = `${cluster.city}, ${cluster.state}`
          const isSelected = selectedLocation === locationKey

          return (
            <Marker
              key={locationKey}
              position={[cluster.lat, cluster.lng]}
              eventHandlers={{
                click: () => onLocationSelect?.(locationKey),
              }}
              opacity={!selectedLocation || isSelected ? 1 : 0.5}
            >
              <Popup>
                <div className="map-popup">
                  <h4>{cluster.city}, {cluster.state}</h4>
                  <p>{cluster.count} nomination{cluster.count !== 1 ? 's' : ''}</p>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}

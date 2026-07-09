import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import type { ReunionNomination } from '../types/ReunionNomination'
import { geocodeCity, type Coordinates } from '../lib/geocodingService'
import './NominationsMap.css'

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const US_CENTER: [number, number] = [39.8283, -98.5795]

type LocationCluster = {
  city: string
  state: string
  count: number
  nominations: ReunionNomination[]
  coords: Coordinates | null
}

type NominationsMapProps = {
  nominations: ReunionNomination[]
  selectedLocation?: string | null
  onLocationSelect?: (location: string) => void
}

export function NominationsMap({ nominations, selectedLocation, onLocationSelect }: NominationsMapProps) {
  // Coordinates resolved client-side for nominations saved before
  // coordinates were stored at write time, keyed by "City, ST".
  const [geocoded, setGeocoded] = useState<Record<string, Coordinates>>({})

  const clusters = useMemo(() => {
    const locationMap = new Map<string, LocationCluster>()

    nominations.forEach((nomination) => {
      const key = `${nomination.city}, ${nomination.state}`
      if (!locationMap.has(key)) {
        const stored =
          nomination.lat !== undefined && nomination.lng !== undefined
            ? { lat: nomination.lat, lng: nomination.lng }
            : null
        locationMap.set(key, {
          city: nomination.city,
          state: nomination.state,
          count: 0,
          nominations: [],
          coords: stored ?? geocoded[key] ?? null,
        })
      }
      const cluster = locationMap.get(key)!
      cluster.count++
      cluster.nominations.push(nomination)
    })

    return Array.from(locationMap.values())
  }, [nominations, geocoded])

  // Look up any clusters still missing coordinates
  useEffect(() => {
    let cancelled = false

    clusters
      .filter((cluster) => cluster.coords === null)
      .forEach(async (cluster) => {
        const coords = await geocodeCity(cluster.city, cluster.state)
        if (coords && !cancelled) {
          setGeocoded((prev) => ({ ...prev, [`${cluster.city}, ${cluster.state}`]: coords }))
        }
      })

    return () => {
      cancelled = true
    }
  }, [clusters])

  if (clusters.length === 0) {
    return (
      <div className="nominations-map-container">
        <div className="map-empty">
          <p>No nomination locations yet</p>
        </div>
      </div>
    )
  }

  const located = clusters.filter(
    (cluster): cluster is LocationCluster & { coords: Coordinates } => cluster.coords !== null,
  )

  // Calculate map bounds
  const center: [number, number] =
    located.length > 0
      ? [
          (Math.max(...located.map((c) => c.coords.lat)) + Math.min(...located.map((c) => c.coords.lat))) / 2,
          (Math.max(...located.map((c) => c.coords.lng)) + Math.min(...located.map((c) => c.coords.lng))) / 2,
        ]
      : US_CENTER

  return (
    <div className="nominations-map-container">
      <div className="map-header">
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
        {located.map((cluster) => {
          const locationKey = `${cluster.city}, ${cluster.state}`
          const isSelected = selectedLocation === locationKey

          return (
            <Marker
              key={locationKey}
              position={[cluster.coords.lat, cluster.coords.lng]}
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

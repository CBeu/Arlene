import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import type { ReunionNomination } from '../types/ReunionNomination'
import { geocodeCity, type Coordinates } from '../lib/geocodingService'
import './NominationsMap.css'

// Custom SVG pin so the marker color follows the app palette; Leaflet's
// default markers are PNG images and can't be tinted with CSS variables
const pinIcon = L.divIcon({
  className: 'map-pin',
  html: `
    <svg viewBox="0 0 30 42" width="30" height="42" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M15 0C6.7 0 0 6.7 0 15c0 10.4 13 25.4 14.1 26.6a1.2 1.2 0 0 0 1.8 0C17 40.4 30 25.4 30 15 30 6.7 23.3 0 15 0z"
        fill="var(--field)"
      />
      <circle cx="15" cy="14.5" r="5.5" fill="var(--paper)" />
    </svg>`,
  iconSize: [30, 42],
  iconAnchor: [15, 42],
  popupAnchor: [0, -36],
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
              icon={pinIcon}
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

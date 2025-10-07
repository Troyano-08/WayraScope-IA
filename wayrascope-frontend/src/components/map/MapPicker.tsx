import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Circle,
  CircleMarker,
  MapContainer,
  Marker,
  ScaleControl,
  TileLayer,
  useMap,
  useMapEvents
} from 'react-leaflet'
import L from 'leaflet'
import { useTranslation } from 'react-i18next'

import { useAppStore } from '../../store/useAppStore'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'

import 'leaflet/dist/leaflet.css'

const limaCenter: [number, number] = [-12.046374, -77.042793]

type Coordinates = { lat: number; lon: number }

const MapInteractiveLayer = ({
  onSelect,
  onHover
}: {
  onSelect: (coords: Coordinates) => void
  onHover: (coords: Coordinates | null) => void
}) => {
  useMapEvents({
    click(e) {
      onSelect({ lat: e.latlng.lat, lon: e.latlng.lng })
    },
    mousemove(e) {
      onHover({ lat: e.latlng.lat, lon: e.latlng.lng })
    },
    mouseout() {
      onHover(null)
    }
  })
  return null
}

const MapViewUpdater = ({ center }: { center: [number, number] }) => {
  const map = useMap()

  useEffect(() => {
    map.flyTo(center, Math.max(map.getZoom(), 6), { duration: 0.35 })
  }, [map, center])

  return null
}

export const MapPicker = () => {
  const { t } = useTranslation('common')
  const { coords, setCoords, setUsePin, usePin } = useAppStore((state) => ({
    coords: state.coords,
    setCoords: state.setCoords,
    setUsePin: state.setUsePin,
    usePin: state.usePin
  }))

  const [isClient, setIsClient] = useState(false)
  const [cursor, setCursor] = useState<Coordinates | null>(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
    })
  }, [])

  const center = useMemo(() => {
    if (coords) return [coords.lat, coords.lon] as [number, number]
    return limaCenter
  }, [coords])

  const handleSelect = (next: Coordinates) => {
    setCoords(next)
    setUsePin(true)
  }

  const handleClear = useCallback(() => {
    setCoords(undefined)
    setUsePin(false)
  }, [setCoords, setUsePin])

  const handleGeolocate = useCallback(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setGeoError(t('map.geoUnsupported'))
      return
    }

    setGeoError(null)
    setGeoLoading(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = {
          lat: position.coords.latitude,
          lon: position.coords.longitude
        }
        setCoords(next)
        setUsePin(true)
        setGeoLoading(false)
      },
      () => {
        setGeoLoading(false)
        setGeoError(t('map.geoError'))
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0
      }
    )
  }, [setCoords, setUsePin, t])

  if (!isClient) {
    return <div className="glass-card h-64 w-full animate-pulse" aria-hidden />
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">
          {t('map.title')}
        </p>
        {usePin && coords && (
          <Badge className="border border-accent/40 bg-accent/10 text-accent uppercase">
            {t('map.radiusLabel', { value: '5 km' })}
          </Badge>
        )}
      </div>
      <div className="relative overflow-hidden rounded-2xl border border-white/10">
        <MapContainer center={center} zoom={8} className="h-64 w-full" attributionControl={false} scrollWheelZoom>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
          <MapInteractiveLayer onSelect={handleSelect} onHover={setCursor} />
          <ScaleControl position="bottomright" />
          {coords && <MapViewUpdater center={[coords.lat, coords.lon]} />}
          {cursor && (
            <CircleMarker
              center={[cursor.lat, cursor.lon]}
              radius={4}
              pathOptions={{ color: '#22d3ee', fillColor: '#22d3ee', fillOpacity: 0.6 }}
            />
          )}
          {coords && (
            <>
              <Marker
                draggable
                position={[coords.lat, coords.lon]}
                eventHandlers={{
                  dragend: (event) => {
                    const { lat, lng } = event.target.getLatLng()
                    handleSelect({ lat, lon: lng })
                  }
                }}
              />
              <Circle center={[coords.lat, coords.lon]} radius={5000} pathOptions={{ color: '#22d3ee', fillOpacity: 0.15 }} />
            </>
          )}
        </MapContainer>
        <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center gap-1 pt-2 text-[11px] font-medium text-white/80 drop-shadow">
          <span>{t('map.instructions')}</span>
          {cursor && (
            <span className="rounded-full bg-slate-900/60 px-2 py-0.5 text-[10px] text-white/90">
              {t('map.cursor', { lat: cursor.lat.toFixed(3), lon: cursor.lon.toFixed(3) })}
            </span>
          )}
        </div>
        {coords && (
          <div className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-slate-900/70 px-3 py-1 text-[11px] text-white/90 shadow-md">
            {t('map.selected', { lat: coords.lat.toFixed(3), lon: coords.lon.toFixed(3) })}
          </div>
        )}
      </div>
      <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span>{t('map.helper')}</span>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              className="px-3 py-1 text-xs"
              onClick={handleGeolocate}
              disabled={geoLoading}
            >
              {geoLoading ? t('map.geoLocating') : t('map.geoLocate')}
            </Button>
            <Button type="button" variant="ghost" className="px-3 py-1 text-xs" onClick={handleClear}>
              {t('map.clear')}
            </Button>
          </div>
        </div>
        {geoError && <p className="text-[11px] text-rose-400">{geoError}</p>}
      </div>
    </div>
  )
}

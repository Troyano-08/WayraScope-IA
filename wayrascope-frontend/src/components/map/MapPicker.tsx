import { useEffect, useMemo, useState } from 'react'
import { Circle, MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { useTranslation } from 'react-i18next'

import { useAppStore } from '../../store/useAppStore'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'

import 'leaflet/dist/leaflet.css'

const limaCenter: [number, number] = [-12.046374, -77.042793]

const MapClickHandler = ({
  onSelect
}: {
  onSelect: (coords: { lat: number; lon: number }) => void
}) => {
  useMapEvents({
    click(e) {
      onSelect({ lat: e.latlng.lat, lon: e.latlng.lng })
    }
  })
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

  const handleSelect = (next: { lat: number; lon: number }) => {
    setCoords(next)
    setUsePin(true)
  }

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
          <MapClickHandler onSelect={handleSelect} />
          {coords && (
            <>
              <Marker position={[coords.lat, coords.lon]} />
              <Circle center={[coords.lat, coords.lon]} radius={5000} pathOptions={{ color: '#22d3ee', fillOpacity: 0.15 }} />
            </>
          )}
        </MapContainer>
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center pt-2 text-xs font-medium text-white/80 drop-shadow">
          {t('map.instructions')}
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>{t('map.helper')}</span>
        <Button
          type="button"
          variant="ghost"
          className="px-3 py-1 text-xs"
          onClick={() => {
            setCoords(undefined)
            setUsePin(false)
          }}
        >
          {t('map.clear')}
        </Button>
      </div>
    </div>
  )
}

import { MapContainer, TileLayer } from 'react-leaflet'

// Full-viewport, non-interactive Positron map used as the backdrop behind
// floating cards (login, signup, profile, collect intro). A soft paper overlay
// keeps the cards comfortably readable.
export function MapBackdrop() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
      <MapContainer
        center={[35.104, -90.025]}
        zoom={13}
        className="absolute inset-0"
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        keyboard={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
      </MapContainer>
      <div className="absolute inset-0 bg-gradient-to-b from-surface-page/70 via-surface-page/35 to-surface-page/80" />
    </div>
  )
}

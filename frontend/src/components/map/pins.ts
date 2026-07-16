import L from 'leaflet'

// Teardrop map pin, extracted from the original TinyHome amenity-pin pattern
// (ParkingVotePage.tsx). Category-specific colors/glyphs are defined per page.
export function pinDivIcon(colorHex: string, glyphSvg: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="background:${colorHex};width:28px;height:28px;border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;
      box-shadow:0 1px 4px rgba(0,0,0,0.4);border:2px solid white;">
      <div style="transform:rotate(45deg);width:15px;height:15px;">${glyphSvg}</div>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  })
}

import L from 'leaflet'

// Teardrop map pin, extracted from the original TinyHome amenity-pin pattern
// (ParkingVotePage.tsx). Category-specific colors/glyphs are defined below.
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

const GLYPHS: Record<string, string> = {
  grocery: '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M4 5h2l2 11h10l2-8H7"/><circle cx="9" cy="19" r="1.3" fill="white" stroke="none"/><circle cx="16" cy="19" r="1.3" fill="white" stroke="none"/></svg>',
  park: '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="9" r="6"/><line x1="12" y1="15" x2="12" y2="21"/></svg>',
  community_center: '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M3 21V10l9-6 9 6v11"/><path d="M9 21v-6h6v6"/></svg>',
  library: '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20V4H6.5A2.5 2.5 0 004 6.5v13z"/></svg>',
  church: '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><line x1="12" y1="2" x2="12" y2="8"/><line x1="9" y1="5" x2="15" y2="5"/><path d="M5 21v-8l7-5 7 5v8"/></svg>',
  school: '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/></svg>',
  bus_stop: '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="4" y="5" width="16" height="12" rx="2"/><circle cx="8" cy="19" r="1.4" fill="white" stroke="none"/><circle cx="16" cy="19" r="1.4" fill="white" stroke="none"/><line x1="4" y1="10" x2="20" y2="10"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="white" stroke="none"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z"/></svg>',
  other: '<svg viewBox="0 0 24 24" fill="white" stroke="none"><circle cx="12" cy="12" r="5"/></svg>',
}

export interface PinCategory {
  key: string
  label: string
  color: string
  icon: L.DivIcon
}

// Community amenity layers on the public map. Keys match the geojson filenames
// under frontend/public/memphis/amenities/.
export const AMENITY_CATEGORIES: PinCategory[] = [
  { key: 'grocery', label: 'Grocery stores', color: '#c2410c', icon: pinDivIcon('#c2410c', GLYPHS.grocery) },
  { key: 'parks', label: 'Parks', color: '#16a34a', icon: pinDivIcon('#16a34a', GLYPHS.park) },
  { key: 'community_centers', label: 'Community centers', color: '#7c3aed', icon: pinDivIcon('#7c3aed', GLYPHS.community_center) },
  { key: 'libraries', label: 'Libraries', color: '#0891b2', icon: pinDivIcon('#0891b2', GLYPHS.library) },
  { key: 'churches', label: 'Churches', color: '#b45309', icon: pinDivIcon('#b45309', GLYPHS.church) },
  { key: 'schools', label: 'Schools', color: '#2563eb', icon: pinDivIcon('#2563eb', GLYPHS.school) },
]

// Categories a researcher can assign to a resident's asset pin in the collection
// tool. Includes the amenity set plus transit and a free-form "other".
export const ASSET_PIN_CATEGORIES: PinCategory[] = [
  ...AMENITY_CATEGORIES,
  { key: 'bus_stop', label: 'Bus stop', color: '#475569', icon: pinDivIcon('#475569', GLYPHS.bus_stop) },
  { key: 'other', label: 'Other', color: '#db2777', icon: pinDivIcon('#db2777', GLYPHS.other) },
]

export const assetPinIcon = (categoryKey: string): L.DivIcon =>
  (ASSET_PIN_CATEGORIES.find(c => c.key === categoryKey) ?? ASSET_PIN_CATEGORIES[ASSET_PIN_CATEGORIES.length - 1]).icon

export const TRANSIT_STOP_ICON = pinDivIcon('#475569', GLYPHS.bus_stop)

// Knowledge Quest, the project's partner organization: one highlighted marker,
// larger and gold so it reads differently from generic amenity pins.
export const KNOWLEDGE_QUEST_ICON = L.divIcon({
  className: '',
  html: `<div style="background:#d97706;width:36px;height:36px;border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;
    box-shadow:0 2px 6px rgba(0,0,0,0.5);border:3px solid white;">
    <div style="transform:rotate(45deg);width:19px;height:19px;">${GLYPHS.star}</div>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
})

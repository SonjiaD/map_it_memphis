import { Marker, Popup } from 'react-leaflet'
import { useStaticGeojson } from './useStaticGeojson'
import { KNOWLEDGE_QUEST_ICON } from './pins'

// Highlighted marker for Knowledge Quest, the project's community partner.
export function KnowledgeQuestMarker() {
  const data = useStaticGeojson('/memphis/knowledge_quest.geojson')
  const feat = data?.features?.[0]
  if (!feat || feat.geometry.type !== 'Point') return null
  const [lng, lat] = feat.geometry.coordinates
  return (
    <Marker position={[lat, lng]} icon={KNOWLEDGE_QUEST_ICON} zIndexOffset={1000}>
      <Popup>
        <div className="text-sm">
          <p className="font-bold mb-0.5">{feat.properties?.name ?? 'Knowledge Quest'}</p>
          <p className="text-gray-600 mb-0.5">{feat.properties?.role}</p>
          <p className="text-gray-500">{feat.properties?.address}</p>
        </div>
      </Popup>
    </Marker>
  )
}

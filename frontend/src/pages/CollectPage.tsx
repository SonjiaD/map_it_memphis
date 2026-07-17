import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Polygon, useMapEvents } from 'react-leaflet'
import type { LatLng } from 'leaflet'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { verticesToGeojsonPolygon } from '../lib/geo'
import { PolygonDrawTool } from '../components/map/PolygonDrawTool'
import { RespondentForm, EMPTY_RESPONDENT, type RespondentMeta } from '../components/collect/RespondentForm'
import { ASSET_PIN_CATEGORIES, assetPinIcon } from '../components/map/pins'
import { MapBackdrop } from '../components/MapBackdrop'

const SESSION_STEPS = ['Consent', 'Draw', 'Places', 'Review']

function ProgressDots({ current, light = false }: { current: number; light?: boolean }) {
  return (
    <div className="flex items-center gap-3 font-mono text-[10px] tracking-wider uppercase flex-wrap">
      {SESSION_STEPS.map((s, i) => {
        const state = i === current ? 'current' : i < current ? 'done' : 'todo'
        const text = light
          ? state === 'current' ? 'text-accent-300' : state === 'done' ? 'text-white/80' : 'text-white/40'
          : state === 'current' ? 'text-accent-600' : state === 'done' ? 'text-primary-700' : 'text-primary-300'
        const dot = light
          ? state === 'current' ? 'bg-accent-300' : state === 'done' ? 'bg-white/80' : 'bg-white/30'
          : state === 'current' ? 'bg-accent-500' : state === 'done' ? 'bg-primary-700' : 'bg-primary-300'
        return (
          <span key={s} className={`flex items-center gap-1.5 ${text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
            {String(i + 1).padStart(2, '0')} {s}
          </span>
        )
      })}
    </div>
  )
}

// Wide South Memphis view: the respondent chooses their own extent, and no
// official boundary layers are ever shown here (they would anchor the drawing).
const START_CENTER: [number, number] = [35.104, -90.025]
const START_ZOOM = 13

type Step = 'info' | 'draw' | 'pins' | 'review' | 'saved'

interface DraftPin {
  lat: number
  lng: number
  category: string
  name: string
  whyItMatters: string
}

function PinTapCapture({ onTap }: { onTap: (latlng: LatLng) => void }) {
  useMapEvents({ click: e => onTap(e.latlng) })
  return null
}

const categoryLabel = (key: string) =>
  ASSET_PIN_CATEGORIES.find(c => c.key === key)?.label ?? key

export default function CollectPage() {
  const { user } = useAuth()
  const [step, setStep] = useState<Step>('info')
  const [respondent, setRespondent] = useState<RespondentMeta>(EMPTY_RESPONDENT)
  const [vertices, setVertices] = useState<LatLng[]>([])
  const [boundaryClosed, setBoundaryClosed] = useState(false)
  const [pins, setPins] = useState<DraftPin[]>([])
  const [pendingPin, setPendingPin] = useState<DraftPin | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  function resetSession() {
    setStep('info')
    setRespondent(EMPTY_RESPONDENT)
    setVertices([])
    setBoundaryClosed(false)
    setPins([])
    setPendingPin(null)
    setSaving(false)
    setSaveError('')
  }

  async function handleSave() {
    if (!user) return
    setSaving(true)
    setSaveError('')
    try {
      const geometry = verticesToGeojsonPolygon(vertices)
      const { data: boundary, error: boundaryError } = await supabase
        .from('drawn_boundaries')
        .insert({
          researcher_id: user.id,
          geometry,
          respondent_age_range: respondent.ageRange,
          years_in_neighborhood: respondent.yearsInNeighborhood,
          respondent_relationship: respondent.relationship,
          consent_given: respondent.consentGiven,
          notes: respondent.notes || null,
        })
        .select('id')
        .single()
      if (boundaryError) throw boundaryError

      if (pins.length > 0) {
        const { error: pinsError } = await supabase.from('asset_pins').insert(
          pins.map(p => ({
            boundary_id: boundary.id,
            researcher_id: user.id,
            lat: p.lat,
            lng: p.lng,
            category: p.category,
            name: p.name || null,
            why_it_matters: p.whyItMatters || null,
          })),
        )
        if (pinsError) throw pinsError
      }
      setStep('saved')
    } catch (err: any) {
      // RLS violations land here too (e.g. account unflagged mid-session)
      setSaveError(err?.message || 'Could not save. Check your connection and researcher access, then try again.')
    } finally {
      setSaving(false)
    }
  }

  // Step 1: respondent info + consent, floating card over the map backdrop
  if (step === 'info') {
    return (
      <div className="relative flex-1 overflow-auto">
        <MapBackdrop />
        <div className="relative z-10 max-w-xl mx-auto px-4 py-24">
          <div className="bg-white rounded-2xl shadow-2xl border border-border p-8">
            <div className="mb-6"><ProgressDots current={0} /></div>
            <h1 className="font-display text-3xl text-primary-900 mb-2">Before you start</h1>
            <p className="text-sm text-primary-500 mb-8">
              Read the consent script with the resident, then fill in these few details.
              Nothing here identifies them.
            </p>
            <RespondentForm value={respondent} onChange={setRespondent} />
            <button
              onClick={() => setStep('draw')}
              disabled={!respondent.consentGiven}
              className="mt-8 w-full bg-primary-900 hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-lg transition-colors"
            >
              Start drawing
            </button>
            {!respondent.consentGiven && (
              <p className="text-center text-sm text-primary-400 mt-3">Consent is required to continue.</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Step 5: saved confirmation
  if (step === 'saved') {
    return (
      <div className="relative flex-1 flex items-center justify-center px-4">
        <MapBackdrop />
        <div className="relative z-10 bg-white rounded-2xl shadow-2xl border border-border p-9 max-w-md text-center">
          <div className="w-14 h-14 rounded-full bg-accent-50 flex items-center justify-center mx-auto mb-5">
            <svg viewBox="0 0 24 24" className="w-7 h-7 text-accent-600" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="font-display text-3xl text-primary-900 mb-2">Session saved</h1>
          <p className="text-sm text-primary-500 mb-7">
            The boundary{pins.length > 0 ? ` and ${pins.length} pin${pins.length === 1 ? '' : 's'}` : ''} are
            saved and will appear on the public map right away.
          </p>
          <button
            onClick={resetSession}
            className="bg-primary-900 hover:bg-primary-700 text-white font-semibold px-7 py-3 rounded-lg transition-colors"
          >
            Start new session
          </button>
        </div>
      </div>
    )
  }

  // Steps 2-4 share the full-screen map
  return (
    <div className="relative flex-1 min-h-0">
      <MapContainer center={START_CENTER} zoom={START_ZOOM} className="absolute inset-0">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {step === 'draw' && (
          <PolygonDrawTool
            active={!boundaryClosed}
            vertices={vertices}
            onChange={setVertices}
            onComplete={() => setBoundaryClosed(true)}
          />
        )}

        {/* Completed boundary stays visible while dropping pins / reviewing */}
        {boundaryClosed && vertices.length >= 3 && (
          <Polygon
            positions={vertices}
            pathOptions={{ color: '#ea580c', weight: 2.5, fillColor: '#f97316', fillOpacity: 0.1 }}
          />
        )}

        {step === 'pins' && !pendingPin && (
          <PinTapCapture onTap={latlng => setPendingPin({ lat: latlng.lat, lng: latlng.lng, category: 'grocery', name: '', whyItMatters: '' })} />
        )}

        {pins.map((p, i) => (
          <Marker key={i} position={[p.lat, p.lng]} icon={assetPinIcon(p.category)} />
        ))}
        {pendingPin && (
          <Marker position={[pendingPin.lat, pendingPin.lng]} icon={assetPinIcon(pendingPin.category)} opacity={0.7} />
        )}
      </MapContainer>

      {/* Instruction banner (below the fixed nav island) */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[1000] bg-primary-900/95 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg max-w-[92%] text-center">
        <div className="flex justify-center mb-1.5">
          <ProgressDots light current={step === 'draw' ? 1 : step === 'pins' ? 2 : 3} />
        </div>
        {step === 'draw' && !boundaryClosed && 'Tap the map to trace the outline of Soulsville as the resident sees it'}
        {step === 'draw' && boundaryClosed && 'Boundary complete. Continue, or clear to redraw.'}
        {step === 'pins' && !pendingPin && 'Tap places that matter to the resident, or continue to review'}
        {step === 'pins' && pendingPin && 'Describe this place below'}
        {step === 'review' && 'Review the session, then save'}
      </div>

      {/* Draw toolbar */}
      {step === 'draw' && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 bg-white rounded-xl shadow-lg border border-border px-3 py-2">
          {!boundaryClosed ? (
            <>
              <button
                onClick={() => setVertices(vertices.slice(0, -1))}
                disabled={vertices.length === 0}
                className="min-h-[44px] px-4 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40"
              >
                Undo
              </button>
              <button
                onClick={() => setVertices([])}
                disabled={vertices.length === 0}
                className="min-h-[44px] px-4 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40"
              >
                Clear
              </button>
              <button
                onClick={() => setBoundaryClosed(true)}
                disabled={vertices.length < 3}
                className="min-h-[44px] px-5 rounded-lg text-sm font-bold bg-primary-900 hover:bg-primary-700 text-white disabled:opacity-40"
              >
                Finish boundary
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setBoundaryClosed(false); setVertices([]) }}
                className="min-h-[44px] px-4 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100"
              >
                Redraw
              </button>
              <button
                onClick={() => setStep('pins')}
                className="min-h-[44px] px-5 rounded-lg text-sm font-bold bg-primary-900 hover:bg-primary-700 text-white"
              >
                Continue to pins
              </button>
            </>
          )}
        </div>
      )}

      {/* Pins toolbar */}
      {step === 'pins' && !pendingPin && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 bg-white rounded-xl shadow-lg border border-border px-3 py-2">
          <button
            onClick={() => setStep('draw')}
            className="min-h-[44px] px-4 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100"
          >
            Back
          </button>
          {pins.length > 0 && (
            <button
              onClick={() => setPins(pins.slice(0, -1))}
              className="min-h-[44px] px-4 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100"
            >
              Remove last pin
            </button>
          )}
          <button
            onClick={() => setStep('review')}
            className="min-h-[44px] px-5 rounded-lg text-sm font-bold bg-primary-900 hover:bg-primary-700 text-white"
          >
            Review{pins.length > 0 ? ` (${pins.length} pin${pins.length === 1 ? '' : 's'})` : ''}
          </button>
        </div>
      )}

      {/* Pending pin bottom sheet */}
      {step === 'pins' && pendingPin && (
        <div className="absolute bottom-0 inset-x-0 z-[1000] bg-white rounded-t-2xl shadow-2xl border-t border-border p-5 max-h-[60%] overflow-auto">
          <div className="max-w-xl mx-auto flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">What kind of place is this?</label>
              <div className="flex flex-wrap gap-2">
                {ASSET_PIN_CATEGORIES.map(c => (
                  <button
                    key={c.key}
                    onClick={() => setPendingPin({ ...pendingPin, category: c.key })}
                    className={`min-h-[44px] px-4 rounded-lg text-sm font-medium border-2 transition-colors ${
                      pendingPin.category === c.key
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-white text-gray-600'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Name (optional)</label>
              <input
                type="text"
                value={pendingPin.name}
                onChange={e => setPendingPin({ ...pendingPin, name: e.target.value })}
                placeholder="e.g. Corner store on Mississippi Blvd"
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Why does this place matter?</label>
              <textarea
                value={pendingPin.whyItMatters}
                onChange={e => setPendingPin({ ...pendingPin, whyItMatters: e.target.value })}
                placeholder="In the resident's own words"
                rows={2}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:border-primary-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPendingPin(null)}
                className="min-h-[44px] flex-1 rounded-lg text-sm font-semibold text-gray-600 border border-border hover:bg-gray-50"
              >
                Discard
              </button>
              <button
                onClick={() => { setPins([...pins, pendingPin]); setPendingPin(null) }}
                className="min-h-[44px] flex-1 rounded-lg text-sm font-bold bg-primary-900 hover:bg-primary-700 text-white"
              >
                Save pin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review sheet */}
      {step === 'review' && (
        <div className="absolute bottom-0 inset-x-0 z-[1000] bg-white rounded-t-2xl shadow-2xl border-t border-border p-5 max-h-[65%] overflow-auto">
          <div className="max-w-xl mx-auto">
            <h2 className="font-display text-xl text-primary-900 mb-3">Review session</h2>
            <div className="text-sm text-gray-600 space-y-1.5 mb-4">
              <p><span className="font-semibold text-gray-800">Boundary:</span> {vertices.length} points</p>
              <p><span className="font-semibold text-gray-800">Respondent:</span> {respondent.relationship}, age {respondent.ageRange}, {respondent.yearsInNeighborhood.toLowerCase()} in the neighborhood</p>
              <p><span className="font-semibold text-gray-800">Consent:</span> recorded</p>
              {pins.length > 0 ? (
                <div>
                  <p className="font-semibold text-gray-800 mb-1">{pins.length} pin{pins.length === 1 ? '' : 's'}:</p>
                  <ul className="space-y-1 pl-1">
                    {pins.map((p, i) => (
                      <li key={i} className="flex items-center justify-between gap-2">
                        <span>{categoryLabel(p.category)}{p.name ? `: ${p.name}` : ''}</span>
                        <button
                          onClick={() => setPins(pins.filter((_, j) => j !== i))}
                          className="text-red-500 hover:text-red-600 text-xs font-semibold px-2 py-1"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-gray-400">No asset pins this session.</p>
              )}
            </div>

            {saveError && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 mb-3">{saveError}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setStep('pins')}
                disabled={saving}
                className="min-h-[44px] flex-1 rounded-lg text-sm font-semibold text-gray-600 border border-border hover:bg-gray-50 disabled:opacity-40"
              >
                Back
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="min-h-[44px] flex-1 rounded-lg text-sm font-bold bg-primary-900 hover:bg-primary-700 text-white disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

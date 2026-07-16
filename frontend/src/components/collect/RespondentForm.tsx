import { CustomSelect } from '../CustomSelect'

// Non-identifying respondent metadata captured at the start of a field session.
export interface RespondentMeta {
  ageRange: string
  yearsInNeighborhood: string
  relationship: string
  consentGiven: boolean
  notes: string
}

export const EMPTY_RESPONDENT: RespondentMeta = {
  ageRange: 'Prefer not to say',
  yearsInNeighborhood: 'Prefer not to say',
  relationship: 'Current resident',
  consentGiven: false,
  notes: '',
}

const AGE_RANGES = ['Under 18', '18-24', '25-34', '35-44', '45-54', '55-64', '65+', 'Prefer not to say']
const YEARS_OPTIONS = ['Less than 1 year', '1-5 years', '6-10 years', '11-20 years', 'More than 20 years', 'Whole life', 'Prefer not to say']
const RELATIONSHIPS = ['Current resident', 'Former resident', 'Works in the neighborhood', 'Family in the neighborhood', 'Other connection']

export function RespondentForm({ value, onChange }: {
  value: RespondentMeta
  onChange: (next: RespondentMeta) => void
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Age range</label>
        <CustomSelect
          options={AGE_RANGES}
          value={value.ageRange}
          onChange={v => onChange({ ...value, ageRange: v })}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Years in the neighborhood</label>
        <CustomSelect
          options={YEARS_OPTIONS}
          value={value.yearsInNeighborhood}
          onChange={v => onChange({ ...value, yearsInNeighborhood: v })}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Connection to Soulsville</label>
        <CustomSelect
          options={RELATIONSHIPS}
          value={value.relationship}
          onChange={v => onChange({ ...value, relationship: v })}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Session notes (optional)</label>
        <textarea
          value={value.notes}
          onChange={e => onChange({ ...value, notes: e.target.value })}
          placeholder="Anything worth remembering about this session. No names or identifying details."
          rows={3}
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-all"
        />
      </div>

      <label className="flex items-start gap-3 bg-teal-50 border border-teal-200 rounded-xl px-4 py-3.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={value.consentGiven}
          onChange={e => onChange({ ...value, consentGiven: e.target.checked })}
          className="accent-teal-600 w-5 h-5 mt-0.5 shrink-0"
        />
        <span className="text-sm text-gray-700 leading-relaxed">
          The resident has heard the consent script, understands their drawing and pins
          will appear on a public map with no identifying details, and agrees to take part.
        </span>
      </label>
    </div>
  )
}

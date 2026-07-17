import { Link } from 'react-router-dom'
import { Footer } from '../components/Footer'
import { Card, SectionLabel } from '../components/ui'

function Section({ step, label, children }: { step?: number; label: string; children: React.ReactNode }) {
  return (
    <Card padding="lg">
      <div className="flex items-center gap-3 mb-3">
        {step !== undefined && (
          <span className="w-8 h-8 rounded-full bg-accent-400 text-primary-900 font-display font-bold text-sm flex items-center justify-center shrink-0">
            {step}
          </span>
        )}
        <SectionLabel>{label}</SectionLabel>
      </div>
      {children}
    </Card>
  )
}

export default function MethodologyPage() {
  return (
    <div className="flex flex-col min-h-full bg-surface-page">
      <div className="bg-primary-900 px-6 py-14 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-primary-700/40" />
        <div className="max-w-4xl mx-auto relative z-10">
          <SectionLabel className="text-accent-400 mb-3">How it works</SectionLabel>
          <h1 className="font-display font-bold text-4xl md:text-5xl text-white mb-3">Methodology</h1>
          <p className="text-primary-200 leading-relaxed max-w-2xl">
            A plain-language explanation of how resident-drawn boundaries are collected
            and compared against official ones.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-6 w-full flex-1">
        <Section step={1} label="Residents draw their neighborhood">
          <p className="text-gray-600 leading-relaxed">
            In community mapping sessions, a youth researcher hands a resident a tablet
            showing a plain street map of South Memphis. The resident traces the outline
            of what they consider Soulsville. Importantly, the drawing screen shows no
            official boundaries at all: no zip code lines, no census tracts. That is
            deliberate. Seeing an official line first would anchor people to it, and the
            whole point is to capture how residents see the neighborhood before anyone
            shows them how the city sees it.
          </p>
        </Section>

        <Section step={2} label="Residents mark the places that matter">
          <p className="text-gray-600 leading-relaxed">
            After drawing their boundary, residents drop pins on the places they consider
            neighborhood assets: grocery stores, churches, parks, schools, or spots that
            do not appear in any official dataset, like an informal gathering place. Each
            pin records why that place matters, in the resident's own words.
          </p>
        </Section>

        <Section step={3} label="The drawings are stacked into a consensus map">
          <p className="text-gray-600 leading-relaxed mb-3">
            Every resident's boundary is laid on top of all the others. The map is divided
            into a fine grid, and each grid cell counts how many residents included it
            inside their Soulsville. Cells that almost everyone included show up dark;
            cells only a few people included show up light.
          </p>
          <p className="text-gray-600 leading-relaxed">
            The result is a consensus heatmap: not one official answer, but a picture of
            agreement. The dark core is the Soulsville everyone shares. The lighter edges
            are where the neighborhood fades, differently for different people.
          </p>
        </Section>

        <Section step={4} label="The consensus is compared with official lines">
          <p className="text-gray-600 leading-relaxed mb-3">
            Official boundaries like census tracts and zip codes are drawn for
            administrative convenience. Researchers call the problem this creates the
            Modifiable Areal Unit Problem: change the lines, and the story the data tells
            about a place changes with them.
          </p>
          <p className="text-gray-600 leading-relaxed">
            The map measures how much the residents' consensus area overlaps each official
            unit. When the overlap is low, that is evidence the official lines miss the
            real neighborhood, which matters because those lines decide how resources and
            attention get allocated.
          </p>
        </Section>

        <Section step={5} label="Oral histories anchor the map in lived experience">
          <p className="text-gray-600 leading-relaxed">
            Alongside the drawings, youth researchers record oral history interviews about
            why residents drew what they drew and what specific places mean to them. A
            future version of this map will let you click a location and hear those
            stories in residents' own voices.
          </p>
        </Section>

        <Section label="Explore the data">
          <p className="text-gray-600 leading-relaxed">
            See it all on the <Link to="/" className="text-primary-600 hover:text-primary-500 font-medium">interactive map</Link>,
            or read more <Link to="/about" className="text-primary-600 hover:text-primary-500 font-medium">about the project</Link>.
          </p>
        </Section>
      </div>

      <Footer />
    </div>
  )
}

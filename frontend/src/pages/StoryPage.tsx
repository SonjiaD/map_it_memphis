import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ScrollyMap } from '../components/story/ScrollyMap'
import { BoundaryMotif } from '../components/BoundaryMotif'
import { Footer } from '../components/Footer'
import { useInViewAnimation } from '../hooks/useInViewAnimation'

// The Story: a scroll-driven map narrative (the project's argument, experienced)
// followed by editorial sections covering method, people, and consent.

interface Chapter {
  kicker: string
  title: string
  body: string
  align?: 'center' | 'left'
}

const CHAPTERS: Chapter[] = [
  {
    kicker: 'A youth-led research project',
    title: 'Whose Soulsville is it?',
    body: 'Scroll to see how a neighborhood gets drawn: by the city, and by the people who live there.',
    align: 'center',
  },
  {
    kicker: 'Chapter one',
    title: 'This is Soulsville.',
    body: 'South Memphis. Birthplace of soul music, home of Stax Records, LeMoyne-Owen College, and our partner Knowledge Quest. The dashed line is roughly where the study looks. It is not an official boundary, because Soulsville does not have one.',
  },
  {
    kicker: 'Chapter two',
    title: 'The city draws it like this.',
    body: 'Census tracts in blue. Zip codes in violet. Soulsville is split across several of each. These lines decide how the neighborhood shows up in data, funding, and plans, and none of them were drawn by residents.',
  },
  {
    kicker: 'Chapter three',
    title: 'Residents draw it like this.',
    body: 'In mapping sessions, residents trace their own Soulsville on a tablet. The shapes here are illustrative examples drawn by our team; as youth researchers collect real boundaries, real ones take their place.',
  },
  {
    kicker: 'Chapter four',
    title: 'The lines do not agree.',
    body: 'Where drawings stack, the shape darkens: that shared core is the Soulsville residents agree on. When it diverges from the official lines, resources and decisions follow the wrong map. Researchers call this the Modifiable Areal Unit Problem. Residents call it being missed.',
  },
  {
    kicker: 'Chapter five',
    title: 'Help us draw it for real.',
    body: 'The live map shows every layer, and it updates the moment a new resident boundary is collected in the field.',
  },
]

function ChapterCard({ chapter, isActive, innerRef }: {
  chapter: Chapter
  isActive: boolean
  innerRef: (el: HTMLDivElement | null) => void
}) {
  const centered = chapter.align === 'center'
  return (
    <div
      ref={innerRef}
      className={`min-h-screen flex items-center ${centered ? 'justify-center' : 'justify-start md:pl-[8%]'} px-4 py-24`}
    >
      <div
        className={`bg-white/95 backdrop-blur rounded-2xl shadow-xl border border-border p-7 md:p-9 transition-opacity duration-500 ${
          centered ? 'max-w-xl text-center' : 'max-w-md'
        } ${isActive ? 'opacity-100' : 'opacity-60'}`}
      >
        <p className="font-mono text-xs font-medium tracking-[0.18em] uppercase text-accent-600 mb-3">{chapter.kicker}</p>
        <h2 className={`font-display text-primary-900 leading-tight mb-4 ${centered ? 'text-5xl md:text-6xl' : 'text-3xl md:text-4xl'}`}>
          {chapter.title}
        </h2>
        <p className="text-primary-600 leading-relaxed">{chapter.body}</p>
        {centered && (
          <div className="mt-6 flex justify-center">
            <BoundaryMotif className="w-40" />
          </div>
        )}
        {chapter.kicker === 'Chapter five' && (
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/?data=1" className="px-5 py-2.5 rounded-lg bg-primary-900 hover:bg-primary-700 text-white text-sm font-semibold transition-colors">
              Explore the live map
            </Link>
            <a href="#method" className="px-5 py-2.5 rounded-lg border border-primary-900 text-primary-900 hover:bg-primary-50 text-sm font-semibold transition-colors">
              How the research works
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

function ImageSlot({ caption, wide = false }: { caption: string; wide?: boolean }) {
  return (
    <figure className={wide ? '' : 'md:max-w-md'}>
      <img
        src="/images/blank.png"
        alt={`Placeholder: ${caption}`}
        className={`w-full rounded-xl bg-surface-muted object-cover ${wide ? 'aspect-[21/9]' : 'aspect-[4/3]'}`}
      />
      <figcaption className="font-mono text-[11px] text-primary-400 mt-2">
        Photo to add: {caption}
      </figcaption>
    </figure>
  )
}

function Editorial({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, className: anim } = useInViewAnimation()
  return (
    <div ref={ref} className={`${anim} ${className}`}>
      {children}
    </div>
  )
}

const METHOD_STEPS = [
  {
    title: 'Residents draw their neighborhood',
    body: 'A youth researcher hands a resident a tablet showing a plain street map. The resident traces the outline of what they consider Soulsville. The drawing screen shows no official lines at all, deliberately: seeing an official boundary first would anchor people to it.',
    image: 'close-up of a tablet showing a hand-drawn boundary',
  },
  {
    title: 'Residents mark the places that matter',
    body: 'After drawing, residents drop pins on the places they consider neighborhood assets: the corner store, the church, the park where everyone actually goes, spots no official dataset knows about. Each pin records why that place matters, in the resident’s own words.',
    image: 'a Soulsville place residents care about (corner store, church, park)',
  },
  {
    title: 'The drawings stack into a consensus map',
    body: 'Every boundary is laid over all the others on a fine grid. Cells almost everyone included show up dark; cells only a few included stay light. The result is not one official answer but a picture of agreement.',
  },
  {
    title: 'The consensus is compared with official lines',
    body: 'The map measures how much the residents’ shared area overlaps each official unit. Low overlap is evidence the official lines miss the real neighborhood, and those lines decide how resources get allocated.',
  },
  {
    title: 'Oral histories anchor it in lived experience',
    body: 'Youth researchers record interviews about why residents drew what they drew. A future version of this map will let you click a location and hear those stories in residents’ own voices.',
  },
]

export default function StoryPage() {
  const [chapter, setChapter] = useState(0)
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = stepRefs.current.indexOf(entry.target as HTMLDivElement)
            if (idx !== -1) setChapter(idx)
          }
        }
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )
    stepRefs.current.forEach(el => el && observer.observe(el))
    return () => observer.disconnect()
  }, [])

  // Anchor scroll for /story#method redirects
  useEffect(() => {
    if (window.location.hash === '#method') {
      setTimeout(() => document.getElementById('method')?.scrollIntoView({ behavior: 'smooth' }), 300)
    }
  }, [])

  return (
    <div>
      {/* Part A: scroll-driven map story */}
      <div className="relative">
        <div className="sticky top-0 h-screen">
          <ScrollyMap chapter={chapter} />
        </div>
        <div className="relative z-10 -mt-[100vh]">
          {CHAPTERS.map((c, i) => (
            <ChapterCard
              key={c.title}
              chapter={c}
              isActive={chapter === i}
              innerRef={el => { stepRefs.current[i] = el }}
            />
          ))}
        </div>
      </div>

      {/* Part B: editorial */}
      <div className="relative z-10 bg-surface-page">
        {/* Pull quote */}
        <section className="px-6 py-24 md:py-32 bg-white border-y border-border">
          <Editorial className="max-w-3xl mx-auto text-center">
            <BoundaryMotif className="w-32 mx-auto mb-8" />
            <p className="font-display italic text-3xl md:text-5xl text-primary-900 leading-tight">
              "Every map of Memphis draws lines around Soulsville. None of them were drawn by the people who live there."
            </p>
          </Editorial>
        </section>

        {/* Stat band */}
        <section className="bg-primary-900 px-6 py-16">
          <Editorial className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-10 text-center">
            {[
              { n: '1', label: 'neighborhood, no official boundary' },
              { n: '10', label: 'youth researchers from Soulsville' },
              { n: '50', label: 'resident interviews planned' },
            ].map(s => (
              <div key={s.label}>
                <p className="font-display text-6xl text-accent-400 mb-2">{s.n}</p>
                <p className="font-mono text-xs tracking-wider uppercase text-primary-200 leading-relaxed">{s.label}</p>
              </div>
            ))}
          </Editorial>
        </section>

        {/* Method timeline */}
        <section id="method" className="px-6 py-24">
          <div className="max-w-3xl mx-auto">
            <Editorial>
              <p className="font-mono text-xs font-medium tracking-[0.18em] uppercase text-accent-600 mb-3">The method</p>
              <h2 className="font-display text-4xl md:text-5xl text-primary-900 mb-14">How the research works</h2>
            </Editorial>
            <ol className="space-y-0">
              {METHOD_STEPS.map((step, i) => (
                <Editorial key={step.title}>
                  <li className="grid grid-cols-[auto_1fr] gap-x-6 md:gap-x-10 border-t border-border py-10">
                    <p className="font-display text-4xl md:text-5xl text-accent-500 leading-none w-14">
                      {String(i + 1).padStart(2, '0')}
                    </p>
                    <div>
                      <h3 className="font-semibold text-lg text-primary-900 mb-2">{step.title}</h3>
                      <p className="text-primary-600 leading-relaxed mb-4">{step.body}</p>
                      {step.image && <ImageSlot caption={step.image} />}
                    </div>
                  </li>
                </Editorial>
              ))}
            </ol>
          </div>
        </section>

        {/* Partners */}
        <section className="px-6 py-24 bg-white border-y border-border">
          <div className="max-w-4xl mx-auto">
            <Editorial>
              <p className="font-mono text-xs font-medium tracking-[0.18em] uppercase text-accent-600 mb-3">The people</p>
              <h2 className="font-display text-4xl md:text-5xl text-primary-900 mb-12">Who is behind it</h2>
            </Editorial>
            <div className="grid md:grid-cols-2 gap-8">
              <Editorial>
                <div className="rounded-2xl border border-border overflow-hidden">
                  <img src="/images/blank.png" alt="Placeholder: Dr. Brenda Mathias portrait" className="w-full aspect-[3/2] object-cover bg-surface-muted" />
                  <div className="p-6">
                    <p className="font-mono text-[11px] text-primary-400 mb-3">Photo to add: Dr. Brenda Mathias portrait</p>
                    <h3 className="font-semibold text-lg text-primary-900 mb-1">Dr. Brenda Mathias</h3>
                    <p className="text-sm text-primary-600 leading-relaxed">
                      Assistant Professor, School of Social Work, University of Memphis. Leads the research and trains the youth researcher cohort.
                    </p>
                  </div>
                </div>
              </Editorial>
              <Editorial>
                <div className="rounded-2xl border border-border overflow-hidden">
                  <img src="/images/blank.png" alt="Placeholder: Knowledge Quest campus or team photo" className="w-full aspect-[3/2] object-cover bg-surface-muted" />
                  <div className="p-6">
                    <p className="font-mono text-[11px] text-primary-400 mb-3">Photo to add: Knowledge Quest campus or team</p>
                    <h3 className="font-semibold text-lg text-primary-900 mb-1">Knowledge Quest</h3>
                    <p className="text-sm text-primary-600 leading-relaxed">
                      A youth-serving nonprofit rooted in Soulsville and the project's community partner. The youth researchers collecting this data are theirs.
                    </p>
                  </div>
                </div>
              </Editorial>
            </div>
          </div>
        </section>

        {/* Consent */}
        <section className="px-6 py-20">
          <Editorial className="max-w-3xl mx-auto">
            <p className="font-mono text-xs font-medium tracking-[0.18em] uppercase text-accent-600 mb-3">Consent and data</p>
            <h2 className="font-display text-3xl md:text-4xl text-primary-900 mb-6">Shared voluntarily, shown carefully</h2>
            <p className="text-primary-600 leading-relaxed mb-4">
              Every boundary and pin on the map was shared voluntarily, with consent recorded at the time of the interview.
              Nothing public identifies an individual resident: no names, no addresses, no exact demographics.
            </p>
            <p className="text-primary-600 leading-relaxed">
              Residents can withdraw their contribution at any time by contacting the study team, and it will be removed
              from the public map. Data is published under a CC BY-NC license.
            </p>
          </Editorial>
        </section>

        {/* CTA band */}
        <section className="bg-primary-900 px-6 py-24 relative overflow-hidden">
          <BoundaryMotif color="#dd7346" className="absolute -top-2 left-1/2 -translate-x-1/2 w-[480px] opacity-40" />
          <Editorial className="max-w-2xl mx-auto text-center relative z-10">
            <h2 className="font-display text-4xl md:text-5xl text-white mb-4">See the map residents are drawing.</h2>
            <p className="text-primary-200 mb-8">Official lines, resident lines, and the places in between.</p>
            <Link to="/?data=1" className="inline-block px-7 py-3 rounded-lg bg-accent-500 hover:bg-accent-400 text-white font-semibold transition-colors">
              Explore the live map
            </Link>
          </Editorial>
        </section>

        <Footer />
      </div>
    </div>
  )
}

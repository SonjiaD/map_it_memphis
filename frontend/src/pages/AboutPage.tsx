import { Link } from 'react-router-dom'
import { Footer } from '../components/Footer'
import { Card, SectionLabel } from '../components/ui'

function AboutSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Card padding="lg">
      <SectionLabel className="mb-3">{label}</SectionLabel>
      {children}
    </Card>
  )
}

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-full bg-surface-page">
      <div className="bg-primary-900 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <SectionLabel className="text-teal-400 mb-3">Soulsville, Memphis</SectionLabel>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">About MAPP It Memphis</h1>
          <p className="text-teal-300 leading-relaxed max-w-2xl">
            Measuring Assets, People, and Places: a youth-led project mapping Soulsville
            the way its residents actually see it.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-6 w-full flex-1">
        <AboutSection label="The idea">
          <p className="text-gray-600 leading-relaxed mb-3">
            Every map of Memphis draws lines around Soulsville: census tracts, zip codes,
            planning districts. Those lines decide how the neighborhood shows up in data,
            in funding decisions, and in city plans. But none of them were drawn by the
            people who live there.
          </p>
          <p className="text-gray-600 leading-relaxed">
            MAPP It Memphis asks residents to draw their own Soulsville, and to mark the
            places that matter to them: the corner store, the church, the park where
            everyone actually goes. When enough residents have drawn their neighborhood,
            the map shows where their answers agree, and how that shared Soulsville
            compares with the official lines.
          </p>
        </AboutSection>

        <AboutSection label="Who is behind it">
          <p className="text-gray-600 leading-relaxed mb-3">
            The project is led by <strong>Dr. Brenda Mathias</strong>, Assistant Professor
            in the School of Social Work at the <strong>University of Memphis</strong>, in
            partnership with <strong>Knowledge Quest</strong>, a youth-serving nonprofit
            based in Soulsville.
          </p>
          <p className="text-gray-600 leading-relaxed">
            The data is collected by trained youth researchers, young adults from the
            neighborhood who run community mapping sessions and record oral history
            interviews with residents. They are co-researchers on this project, not
            subjects of it.
          </p>
        </AboutSection>

        <AboutSection label="Consent and data use">
          <p className="text-gray-600 leading-relaxed mb-3">
            Every boundary and every pin on this map was shared voluntarily, with consent
            recorded at the time of the interview. Nothing on the public map identifies an
            individual resident: no names, no addresses, no exact demographic details.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Residents can withdraw their contribution at any time by contacting the study
            team, and it will be removed from the public map.
          </p>
        </AboutSection>

        <AboutSection label="Explore">
          <p className="text-gray-600 leading-relaxed">
            Start with the <Link to="/" className="text-teal-700 hover:text-teal-600 font-medium">interactive map</Link>,
            or read about <Link to="/methodology" className="text-teal-700 hover:text-teal-600 font-medium">how the boundaries are compared</Link>.
          </p>
        </AboutSection>
      </div>

      <Footer />
    </div>
  )
}

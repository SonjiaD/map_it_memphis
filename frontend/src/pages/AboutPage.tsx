import { Footer } from '../components/Footer'
import { Card, SectionLabel } from '../components/ui'

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-surface-page">
      <div className="bg-primary-900 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <SectionLabel className="text-teal-400 mb-3">Soulsville, Memphis</SectionLabel>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">About MAPP Memphis</h1>
          <p className="text-teal-300 leading-relaxed max-w-2xl">
            Measuring Assets, People, and Places: a youth-led project comparing how residents
            define their own neighborhood against official city boundaries.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-6 w-full flex-1">
        <Card padding="lg">
          <SectionLabel className="mb-3">Project background</SectionLabel>
          <p className="text-gray-600 leading-relaxed">
            Full project background, methodology, and Knowledge Quest partnership details are coming soon.
          </p>
        </Card>
      </div>

      <Footer />
    </div>
  )
}

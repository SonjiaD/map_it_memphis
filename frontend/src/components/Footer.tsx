import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="bg-primary-900 text-primary-200">
      <div className="max-w-5xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <p className="font-display text-2xl text-white mb-3">MAPP It Memphis</p>
          <p className="text-sm leading-relaxed text-primary-300">
            Measuring Assets, People, and Places: mapping Soulsville the way its residents see it.
          </p>
        </div>
        <div>
          <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-primary-400 mb-4">Site</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-white transition-colors">Explore the map</Link></li>
            <li><Link to="/story" className="hover:text-white transition-colors">The Story</Link></li>
            <li><Link to="/login" className="hover:text-white transition-colors">Researcher login</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-primary-400 mb-4">Credits</p>
          <ul className="space-y-2 text-sm text-primary-300">
            <li>University of Memphis, School of Social Work</li>
            <li>Knowledge Quest, Soulsville</li>
            <li>Map data: OpenStreetMap, US Census, CARTO</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-800">
        <p className="max-w-5xl mx-auto px-6 py-5 font-mono text-[11px] text-primary-400">
          &copy; 2026 MAPP It Memphis. Research data published under CC BY-NC.
        </p>
      </div>
    </footer>
  )
}

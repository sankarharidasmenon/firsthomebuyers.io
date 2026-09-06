import { Navbar } from '@/components/home/Navbar'
import { SchemeLibraryBrowser } from '@/components/schemes/SchemeLibraryBrowser'

export const metadata = {
  title: 'Grants & Schemes Library | FirstHomeBuyers',
  description: 'Browsable reference library of first home buyer grants and schemes across all Australian states and territories.',
}

export default function SchemeLibraryPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FAFAFA' }}>
      <Navbar />
      <main className="flex-1 pt-14 lg:pt-[72px]">
        <div className="max-w-[1150px] mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <div className="mb-6">
            <h1
              style={{
                fontSize: 'clamp(24px, 3.2vw, 40px)',
                fontWeight: 500,
                fontFamily: 'Inter, sans-serif',
                color: '#111111',
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                marginBottom: 12,
              }}
            >
              Grants &amp; Schemes Library
            </h1>
            <p
              style={{
                fontSize: 15,
                fontFamily: 'Inter, sans-serif',
                fontWeight: 300,
                color: '#444444',
                maxWidth: 560,
              }}
            >
              Search and browse first home buyer grants and schemes across every Australian state and territory.
            </p>
          </div>

          <SchemeLibraryBrowser />
        </div>
      </main>
    </div>
  )
}

import { Navbar } from '@/components/home/Navbar'
import { AustraliaGrantMap } from '@/components/map/AustraliaGrantMap'

export const metadata = {
  title: "Australia's First Home Grants Map | FirstHomeBuyers",
  description: 'Interactive map showing first home buyer grants and schemes by state across Australia.',
}

export default function MapPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FAFAFA' }}>
      <Navbar />
      <main className="flex-1 pt-14 lg:pt-[72px]">
        <div className="max-w-[1150px] mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <div className="mb-8">
            {/* <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C4A000', fontFamily: 'Inter, sans-serif', marginBottom: 12 }}>
              Grants by Location
            </div> */}
            <h1 style={{ fontSize: 'clamp(24px, 3.2vw, 40px)', fontWeight: 500, fontFamily: 'Inter, sans-serif', color: '#111111', lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 12 }}>
              Australia&apos;s First Home<br />Grants & Schemes Map View 
            </h1>
            <p style={{ fontSize: 15, fontFamily: 'Inter, sans-serif', fontWeight: 300, color: '#444444', maxWidth: 520 }}>
              Explore federal and state grants available to first home buyers across Australia. Click any state to see a full breakdown.
            </p>
          </div>

          <AustraliaGrantMap />
        </div>
      </main>
    </div>
  )
}

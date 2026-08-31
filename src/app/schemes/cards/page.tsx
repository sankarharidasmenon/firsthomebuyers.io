import { Navbar } from '@/components/home/Navbar'
import { SchemeCardPack } from '@/components/schemes/SchemeCardPack'

export const metadata = {
  title: 'Federal Scheme Cards | FirstHomeBuyers',
  description: 'Australia\'s four Federal first home buyer schemes as a collectible card pack — open the pack, flip each card for its stats.',
}

export default function SchemeCardsPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FAFAFA' }}>
      <Navbar />
      <main className="flex-1 pt-14 lg:pt-[72px]">
        <div className="max-w-[1150px] mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <div className="mb-10 text-center">
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
              Pull your first home buyer card
            </h1>
            <p
              style={{
                fontSize: 15,
                fontFamily: 'Inter, sans-serif',
                fontWeight: 300,
                color: '#444444',
                maxWidth: 460,
                margin: '0 auto',
              }}
            >
              Four Federal schemes, four cards. Tap open, then tap each card to flip the stats.
            </p>
          </div>

          <SchemeCardPack />
        </div>
      </main>
    </div>
  )
}

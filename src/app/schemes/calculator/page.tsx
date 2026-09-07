import { Navbar } from '@/components/home/Navbar'
import { SchemesLibraryCalculator } from '@/components/schemes/SchemesLibraryCalculator'

export const metadata = {
  title: 'All-States Scheme Calculator | FirstHomeBuyers',
  description: 'Estimate which first home buyer grants and schemes you may qualify for across all Australian states and territories.',
}

export default function SchemesLibraryCalculatorPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#EDEAE1' }}>
      <Navbar />
      <main className="flex-1 pt-14 lg:pt-[72px]">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <SchemesLibraryCalculator />
        </div>
      </main>
    </div>
  )
}

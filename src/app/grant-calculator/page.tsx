'use client'

import { Navbar } from '@/components/home/Navbar'
import { GrantCalculatorSection } from '@/components/home/GrantCalculatorSection'

export default function GrantCalculatorPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FEFCE8]">
      <Navbar />
      <main className="flex-1 pt-14 lg:pt-[72px]">
        <GrantCalculatorSection />
      </main>
    </div>
  )
}

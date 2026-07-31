import React from 'react'
import AskAISection from '@/components/home/AskAISection'

export const metadata = {
  title: 'Ask AI — FirstNest',
  description: 'Get personalised guidance for grants, borrowing capacity, and buying readiness.',
}

export default function AskAIPage() {
  return (
    <main className="flex-1 flex flex-col pt-14 lg:pt-[72px] bg-background">
      <div className="flex-1 flex items-center justify-center py-8 lg:py-12">
        <div className="w-full">
          <AskAISection />
        </div>
      </div>
    </main>
  )
}

import type { Metadata } from 'next'
import { ForumHero } from '@/components/forums/ForumHero'
import { ForumsExperience } from '@/components/forums/ForumsExperience'

export const metadata: Metadata = {
  title: 'FirstNest Community — Australia\'s First Home Buyer Forum',
  description:
    'Learn from thousands of Australians buying their first home. Real experiences, real advice and real conversations on grants, borrowing, suburbs, building and settlement.',
}

export default function ForumsPage() {
  return (
    <main className="bg-background pt-14 lg:pt-18">
      <ForumHero />
      <ForumsExperience />
    </main>
  )
}

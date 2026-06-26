import { Metadata } from 'next'
import { Suspense } from 'react'
import ProfilePageContent from '@/components/profile/ProfilePageContent'

export const metadata: Metadata = {
  title: 'My Profile — FirstNest',
  description: 'Review and update your home buying profile. Personalised to your goals and situation.',
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ProfilePageContent />
    </Suspense>
  )
}

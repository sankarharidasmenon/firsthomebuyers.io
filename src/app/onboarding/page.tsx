import { Suspense } from 'react'
import { QuestionnaireFlow } from '@/components/questionnaire/QuestionnaireFlow'

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <QuestionnaireFlow />
    </Suspense>
  )
}

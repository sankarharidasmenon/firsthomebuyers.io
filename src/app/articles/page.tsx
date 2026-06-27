import type { Metadata } from 'next'
import ArticlesPageContent from '@/components/articles/ArticlesPageContent'

export const metadata: Metadata = {
  title: 'Articles — FirstNest AI | First Home Buyer Guides',
  description:
    'Practical guides on Australian grants, buying strategy, mortgage readiness, suburb analysis, and property risk — written in plain English for first-home buyers.',
}

export default function ArticlesPage() {
  return <ArticlesPageContent />
}

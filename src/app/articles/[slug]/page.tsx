import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import ArticleDetailContent from '@/components/articles/ArticleDetailContent'
import { MOCK_ARTICLES } from '@/lib/mockArticles'


// Pre-generate all article pages at build time
export function generateStaticParams() {
  return MOCK_ARTICLES.map((a) => ({ slug: a.slug }))
}

// Next.js 16: params is a Promise
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const article = MOCK_ARTICLES.find((a) => a.slug === slug)
  if (!article) return { title: 'Article not found' }
  return {
    title: `${article.title} — FirstNest AI`,
    description: article.excerpt,
  }
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const article = MOCK_ARTICLES.find((a) => a.slug === slug)

  if (!article) notFound()

  // Related: same category first, then others — exclude current, max 3
  const sameCategory = MOCK_ARTICLES.filter(
    (a) => a.id !== article.id && a.category === article.category,
  )
  const others = MOCK_ARTICLES.filter(
    (a) => a.id !== article.id && a.category !== article.category,
  )
  const relatedArticles = [...sameCategory, ...others].slice(0, 3)

  return <ArticleDetailContent article={article} relatedArticles={relatedArticles} />
}

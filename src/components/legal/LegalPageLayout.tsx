import React from 'react'
import Link from 'next/link'

interface LegalPageLayoutProps {
  title: string
  lastUpdated: string
  children: React.ReactNode
}

export function LegalPageLayout({ title, lastUpdated, children }: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground py-12 md:py-20 px-4 sm:px-6">
      <div className="max-w-[840px] mx-auto w-full">
        {/* Breadcrumb / Back Navigation */}
        {/* <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg
              className="mr-2"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
        </div> */}

        {/* Page Header */}
        <div className="mb-12 mt-15">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-foreground">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Last Updated: {lastUpdated}
          </p>
        </div>

        {/* Content Wrapper */}
        <div className="flex flex-col gap-6">
          {children}
        </div>
      </div>
    </div>
  )
}

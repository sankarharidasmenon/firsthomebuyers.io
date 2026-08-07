import React from 'react'

interface LegalSectionProps {
  title?: string
  children: React.ReactNode
}

export function LegalSection({ title, children }: LegalSectionProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm transition-shadow hover:shadow-md">
      {title && (
        <div className="mb-6 pb-4 border-b border-border/60">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-card-foreground">
            {title}
          </h2>
        </div>
      )}
      <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
        {children}
      </div>
    </div>
  )
}

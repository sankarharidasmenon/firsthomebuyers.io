import type { ReactNode } from 'react'

export function SectionHeading({ title, meta }: { title: string; meta?: ReactNode }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      {meta && <span className="text-xs text-muted-foreground">{meta}</span>}
    </div>
  )
}

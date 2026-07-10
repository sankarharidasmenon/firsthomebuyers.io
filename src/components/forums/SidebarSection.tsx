import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

type SidebarEmphasis = 'high' | 'medium' | 'low'

export function SidebarSection({
  title,
  icon: Icon,
  action,
  children,
  emphasis = 'low',
}: {
  title: string
  icon?: LucideIcon
  action?: ReactNode
  children: ReactNode
  emphasis?: SidebarEmphasis
}) {
  const containerClass = {
    high: 'rounded-[20px] border border-amber-200/50 bg-gradient-to-br from-amber-50 to-white/50 p-6 shadow-md backdrop-blur-md dark:border-border dark:from-surface dark:to-background',
    medium: 'rounded-[20px] border border-border/40 bg-card p-5 shadow-sm',
    low: 'rounded-[20px] bg-transparent p-4', // Quiet, no border/shadow
  }[emphasis]

  return (
    <section className={containerClass}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
          {Icon && <Icon className="size-4 text-muted-foreground" aria-hidden />}
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  )
}

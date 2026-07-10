import { Award } from 'lucide-react'
import { CONTRIBUTORS, formatCount } from '@/lib/forumsData'
import { Avatar } from './Avatar'
import { SidebarSection } from './SidebarSection'

export function TopContributors() {
  return (
    <SidebarSection title="Top Contributors" icon={Award}>
      <ul className="flex flex-col gap-3">
        {CONTRIBUTORS.map((c) => (
          <li key={c.name} className="flex items-center gap-3">
            <Avatar initials={c.initials} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
              <p className="truncate text-xs text-muted-foreground">{c.badge} · {c.location}</p>
            </div>
            <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
              {formatCount(c.helpfulAnswers)}
            </span>
          </li>
        ))}
      </ul>
    </SidebarSection>
  )
}

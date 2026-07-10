import { Check, HeartHandshake } from 'lucide-react'
import { GUIDELINES } from '@/lib/forumsData'
import { SidebarSection } from './SidebarSection'

export function CommunityGuidelines() {
  return (
    <SidebarSection title="Community Guidelines" icon={HeartHandshake}>
      <ul className="flex flex-col gap-2.5">
        {GUIDELINES.map((g) => (
          <li key={g} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
            <Check className="mt-0.5 size-4 shrink-0 text-foreground" aria-hidden />
            <span>{g}</span>
          </li>
        ))}
      </ul>
    </SidebarSection>
  )
}

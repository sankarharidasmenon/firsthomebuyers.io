import Link from 'next/link'
import { TrendingUp } from 'lucide-react'
import { formatCount, type Discussion } from '@/lib/forumsData'
import { SidebarSection } from './SidebarSection'

/** Ranked list of trending / most-viewed discussions. */
export function TrendingList({ title, discussions, emphasis }: { title: string; discussions: Discussion[], emphasis?: 'high' | 'medium' | 'low' }) {
  return (
    <SidebarSection title={title} icon={TrendingUp} emphasis={emphasis}>
      <ol className="flex flex-col">
        {discussions.map((d, i) => (
          <li key={d.id}>
            <Link
              href={`/forums/${d.slug}`}
              className="group flex gap-3 rounded-lg px-1 py-2.5 transition-colors hover:bg-accent"
            >
              <span className="mt-0.5 w-5 shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="line-clamp-2 text-sm font-medium leading-snug text-foreground group-hover:text-foreground">
                  {d.title}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {formatCount(d.replies)} replies · {formatCount(d.views)} views
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </SidebarSection>
  )
}

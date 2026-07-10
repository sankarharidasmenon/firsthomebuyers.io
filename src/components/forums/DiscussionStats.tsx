import { MessageSquare, Eye, Heart } from 'lucide-react'
import { formatCount } from '@/lib/forumsData'
import { cn } from '@/lib/utils'

interface Props {
  replies: number
  views: number
  likes: number
  className?: string
}

/** Compact, muted reply / view / like counts. Reusable across cards + detail. */
export function DiscussionStats({ replies, views, likes, className }: Props) {
  const items = [
    { icon: MessageSquare, value: replies, label: 'replies' },
    { icon: Eye, value: views, label: 'views' },
    { icon: Heart, value: likes, label: 'likes' },
  ]
  return (
    <div className={cn('flex items-center gap-4 text-xs text-muted-foreground', className)}>
      {items.map(({ icon: Icon, value, label }) => (
        <span key={label} className="inline-flex items-center gap-1.5" title={`${value.toLocaleString()} ${label}`}>
          <Icon className="size-3.5" aria-hidden />
          <span className="tabular-nums">{formatCount(value)}</span>
        </span>
      ))}
    </div>
  )
}

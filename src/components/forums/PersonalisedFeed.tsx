'use client'

import { MapPin, Users, Flame, Sparkles } from 'lucide-react'

export function PersonalisedFeed() {
  const items = [
    { icon: MapPin, label: 'Trending in Victoria', color: 'text-foreground' },
    { icon: Users, label: 'Popular with first-home buyers', color: 'text-foreground' },
    { icon: Sparkles, label: 'Buyers like you are discussing...', color: 'text-foreground' },
    { icon: Flame, label: 'New discussions today', color: 'text-foreground' },
  ]

  return (
    <section className="bg-background py-4 sm:py-6 border-b border-border">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <h2 className="sr-only">Personalised for you</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:text-foreground hover:shadow-md"
            >
              <item.icon className={`size-4 ${item.color}`} aria-hidden />
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

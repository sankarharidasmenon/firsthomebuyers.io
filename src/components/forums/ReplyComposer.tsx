import { Lock, Navigation } from 'lucide-react'
import { Avatar } from './Avatar'

/**
 * Reply composer — styled as a premium interactive input.
 * Simulates a rich text editor placeholder for the MVP.
 */
export function ReplyComposer() {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm transition-all focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/10">
      <div className="flex items-start gap-4">
        <Avatar initials="You" size="md" />
        <div className="min-w-0 flex-1">
          <textarea
            className="min-h-[120px] w-full resize-none bg-transparent p-0 text-[1.0625rem] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
            placeholder="Share your experience or add to the discussion..."
            disabled
          />
          <div className="mt-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Lock className="size-3.5" aria-hidden />
              Replies are coming soon — no account needed.
            </p>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                className="flex-1 sm:flex-none h-10 rounded-full px-5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 sm:flex-none inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 hover:shadow"
              >
                <Navigation className="size-4" aria-hidden />
                Reply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

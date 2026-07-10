import { cn } from '@/lib/utils'

/** Calm, theme-safe initials avatar (no per-user colours). */
export function Avatar({ initials, size = 'md', className }: { initials: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const dims = size === 'lg' ? 'size-11 text-sm' : size === 'sm' ? 'size-7 text-[0.625rem]' : 'size-9 text-xs'
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-secondary font-semibold text-secondary-foreground ring-1 ring-border select-none',
        dims,
        className,
      )}
      aria-hidden
    >
      {initials}
    </span>
  )
}

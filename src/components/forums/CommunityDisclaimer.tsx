/**
 * Legal notice disclaiming responsibility for user-generated content.
 * Shared by the community index and individual discussion pages — keep the
 * wording in one place so legal copy never drifts between them.
 */
export function CommunityDisclaimer({ className = '' }: { className?: string }) {
  return (
    <p className={`border-t border-border pt-6 text-xs leading-relaxed text-muted-foreground ${className}`}>
      <strong className="font-semibold text-foreground">Disclaimer:</strong>{' '}
      Views and opinions expressed by individual users within the FirstNest Community are their own
      and do not necessarily reflect the views of FirstNest. FirstNest does not endorse or accept
      responsibility for the accuracy, completeness, or reliability of user-generated content.
    </p>
  )
}

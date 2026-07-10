/** Ultra-compact header for the community landing page. */
export function ForumHero() {
  return (
    <section className="bg-background pt-8 pb-2">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          FirstNest Community
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Real experiences, practical advice and discussions for Australian first-home buyers.
        </p>
      </div>
    </section>
  )
}

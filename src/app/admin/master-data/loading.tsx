/** Skeleton shown while the admin page's server data loads. */
import { Database } from 'lucide-react';

function Bar({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-foreground/10 ${className}`} />;
}

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--color-lemon)]/60 text-black">
          <Database className="size-5" />
        </div>
        <div className="flex flex-col gap-2">
          <Bar className="h-4 w-52" />
          <Bar className="h-3 w-32" />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="rounded-xl ring-1 ring-foreground/10 p-6">
            <Bar className="h-4 w-56" />
            <Bar className="mt-4 h-40 w-full" />
            <Bar className="mt-4 h-12 w-full" />
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="rounded-xl ring-1 ring-foreground/10 p-6">
            <Bar className="h-4 w-40" />
            {[...Array(5)].map((_, i) => <Bar key={i} className="mt-4 h-4 w-full" />)}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-xl ring-1 ring-foreground/10 p-6">
        <Bar className="h-4 w-40" />
        {[...Array(4)].map((_, i) => <Bar key={i} className="mt-4 h-6 w-full" />)}
      </div>
    </main>
  );
}

'use client'

import { Navbar } from '@/components/home/Navbar'
import { GrantCards } from '@/components/home/GrantCards'

export default function SchemesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-fn-yellow-pale)] dark:bg-background">
      <Navbar />
      <main className="flex-1 pt-14 lg:pt-[72px]">
        <GrantCards />
      </main>
    </div>
  )
}

import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { BottomNav } from '@/components/navigation/BottomNav'
import { Footer } from '@/components/layout/Footer'
import { GlobalBackButton } from '@/components/navigation/GlobalBackButton'
import { Navbar } from '@/components/home/Navbar'
import { ThemeProvider } from '@/components/theme/ThemeProvider'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-display',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'FirstNest — Know Your Budget. Know Your Grants.',
  description: "Australia's smartest first home buyer tool — free, fast, no login needed.",
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#F5E642',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="text-foreground antialiased flex flex-col min-h-screen" style={{ background: 'var(--color-brand-dark-surface)' }}>
        <ThemeProvider>
          <div className="flex-1 flex flex-col bg-background">
            <Navbar />
            <GlobalBackButton />
            {children}
          </div>
          <Footer />
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  )
}

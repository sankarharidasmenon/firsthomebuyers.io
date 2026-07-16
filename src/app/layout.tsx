import type { Metadata, Viewport } from 'next'
import { Inter, Fraunces, DM_Sans } from 'next/font/google'
import './globals.css'
import { BottomNav } from '@/components/navigation/BottomNav'
import { Footer } from '@/components/layout/Footer'
import { GlobalBackButton } from '@/components/navigation/GlobalBackButton'
import { Navbar } from '@/components/home/Navbar'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { Toaster } from 'sonner'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-body',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-sans',
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
      className={`${inter.variable} ${fraunces.variable} ${dmSans.variable}`}
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
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: {
                background: '#111111',
                color: '#FFFFFF',
                border: 'none',
                fontFamily: 'Inter, sans-serif',
                borderRadius: '9999px',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}

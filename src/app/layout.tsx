import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { BottomNav } from '@/components/navigation/BottomNav'
import { Footer } from '@/components/layout/Footer'
import { GlobalBackButton } from '@/components/navigation/GlobalBackButton'

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
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-white text-[#222222] antialiased flex flex-col min-h-screen">
        <div className="flex-1 flex flex-col">
          <GlobalBackButton />
          {children}
        </div>
        <Footer />
        <BottomNav />
      </body>
    </html>
  )
}

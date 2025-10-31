import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ActivityBar } from '@/components/activity-bar'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'omni-ai - Intelligent Investigation Agent',
  description: 'AI-powered investigation assistant for enterprise APIs'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={inter.variable}>
        <div className="flex h-screen overflow-hidden">
          <ActivityBar />
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}

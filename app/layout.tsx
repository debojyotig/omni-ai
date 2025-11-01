import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ActivityBar } from '@/components/activity-bar'
import { CommandPalette } from '@/components/command-palette'
import { ThemeProvider } from '@/components/theme-provider'

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
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex h-screen overflow-hidden">
            <ActivityBar />
            <main className="flex-1 overflow-hidden">
              {children}
            </main>
          </div>
          <CommandPalette />
        </ThemeProvider>
      </body>
    </html>
  )
}

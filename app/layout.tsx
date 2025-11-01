import type { Metadata } from 'next'
import './globals.css'
import { CommandPalette } from '@/components/command-palette'
import { ThemeProvider } from '@/components/theme-provider'

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
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <CommandPalette />
        </ThemeProvider>
      </body>
    </html>
  )
}

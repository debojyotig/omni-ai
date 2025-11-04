import type { Metadata } from 'next'
import './globals.css'
import { CommandPalette } from '@/components/command-palette'
import { ThemeProvider } from '@/components/theme-provider'

export const metadata: Metadata = {
  title: 'omni-ai - Intelligent Investigation Agent',
  description: 'AI-powered investigation assistant for enterprise APIs'
}

export const dynamic = 'force-dynamic'

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
      </head>
      <body className="antialiased">
        {/* Skip to main content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded"
        >
          Skip to main content
        </a>

        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Main content wrapper with accessibility attributes */}
          <div id="main-content" role="main">
            {children}
          </div>
          <CommandPalette />
        </ThemeProvider>
      </body>
    </html>
  )
}

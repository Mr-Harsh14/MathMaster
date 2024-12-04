import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MathMaster - Learn Mathematics',
  description: 'An interactive platform for learning mathematics',
}

// These attributes are added by browser extensions like Grammarly
const allowedAttributes = {
  'data-new-gr-c-s-check-loaded': true,
  'data-gr-ext-installed': true,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${inter.className} h-full bg-gray-50`}
        {...allowedAttributes}
        suppressHydrationWarning
      >
        <Providers>
          <div className="min-h-full">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
} 
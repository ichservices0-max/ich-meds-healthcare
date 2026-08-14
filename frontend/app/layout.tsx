import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from 'react-hot-toast'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FAFAFB',
}

export const metadata: Metadata = {
  title: 'ICH Meds — Patient Portal',
  description: 'ICH Meds — Your comprehensive ICH Meds management platform. Book appointments, consult doctors, and manage medical records securely.',
  keywords: 'ICH Meds, ICH Meds, patient portal, doctor appointment, medical records, telemedicine',
  authors: [{ name: 'ICH Meds Team' }],
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'ICH Meds — Patient Portal',
    description: 'ICH Meds — Your comprehensive ICH Meds management platform',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans bg-surface-50 text-ink min-h-screen antialiased">
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  borderRadius: '12px',
                  fontWeight: '600',
                  fontSize: '14px',
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

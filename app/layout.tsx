// app/layout.tsx - Root layout with NextAuth provider
import './globals.css'
import { NextAuthProvider } from '../components/auth/AuthProvider'

export const metadata = {
  title: 'Ace Your Role - AI Roleplay Training',
  description: 'Practice conversations with AI-powered roleplay scenarios.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <NextAuthProvider>
          {children}
        </NextAuthProvider>
      </body>
    </html>
  )
}

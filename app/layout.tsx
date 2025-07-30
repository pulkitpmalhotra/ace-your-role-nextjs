// FILE 1: app/layout.tsx (TypeScript only)
import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Ace Your Role - AI Roleplay Training',
  description: 'Practice sales conversations with AI-powered roleplay scenarios.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}

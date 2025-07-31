// app/layout.tsx - Simple layout without NextAuth
import './globals.css'

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
      <body>{children}</body>
    </html>
  )
}

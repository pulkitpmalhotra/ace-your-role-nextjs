// components/auth/AuthProvider.tsx - Simple NextAuth provider
'use client';

import { SessionProvider } from 'next-auth/react';

export function NextAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}

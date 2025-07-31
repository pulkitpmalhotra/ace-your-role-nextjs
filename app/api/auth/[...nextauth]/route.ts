import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'demo-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'demo-secret',
    })
  ],
  
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        console.log('Google sign-in:', user.email);
        return true;
      }
      return false;
    },

    async session({ session }) {
      return session;
    }
  },

  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-dev',
});

export { handler as GET, handler as POST };

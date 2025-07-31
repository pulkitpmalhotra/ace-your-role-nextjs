// app/api/auth/[...nextauth]/route.ts - Simple NextAuth without Supabase
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          scope: 'openid email profile',
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code'
        }
      }
    })
  ],
  
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === 'google' && user.email) {
          console.log('🔐 Google sign-in successful:', user.email);
          
          // For now, just allow the sign-in without database operations
          // We'll add Supabase integration later
          return true;
        }
        return false;
      } catch (error) {
        console.error('❌ Sign-in error:', error);
        return false;
      }
    },

    async jwt({ token, user, account }) {
      if (account && user) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.googleId = account.providerAccountId;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user?.email) {
        // Add additional data to session
        session.user = {
          ...session.user,
          googleId: token.googleId as string,
        };
      }
      return session;
    }
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };

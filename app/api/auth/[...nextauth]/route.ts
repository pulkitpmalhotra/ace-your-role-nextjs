// app/api/auth/[...nextauth]/route.ts - NextAuth configuration
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { supabaseAdmin } from '@/lib/supabase';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
          console.log('🔐 Google sign-in:', user.email);
          
          // Create or update user in Supabase
          const { data: existingUser, error: fetchError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single();

          if (!existingUser) {
            // Create new user
            const { error: insertError } = await supabaseAdmin
              .from('users')
              .insert({
                email: user.email,
                full_name: user.name || '',
                google_id: profile?.sub || user.id,
                profile_picture: user.image || '',
                email_verified: profile?.email_verified || false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                preferences: {
                  notifications: true,
                  theme: 'light',
                  language: 'en',
                  privacy_level: 'basic'
                }
              });

            if (insertError) {
              console.error('❌ Error creating user:', insertError);
              return false;
            }
            
            console.log('✅ New user created:', user.email);
          } else {
            // Update existing user with latest Google info
            const { error: updateError } = await supabaseAdmin
              .from('users')
              .update({
                full_name: user.name || existingUser.full_name,
                profile_picture: user.image || existingUser.profile_picture,
                updated_at: new Date().toISOString()
              })
              .eq('email', user.email);

            if (updateError) {
              console.error('❌ Error updating user:', updateError);
            } else {
              console.log('✅ User updated:', user.email);
            }
          }
          
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
        // Fetch additional user data from Supabase
        const { data: userData } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('email', session.user.email)
          .single();

        if (userData) {
          session.user = {
            ...session.user,
            id: userData.id,
            googleId: token.googleId as string,
            company: userData.company,
            role: userData.role,
            preferences: userData.preferences,
            createdAt: userData.created_at
          };
        }
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

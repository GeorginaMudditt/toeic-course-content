import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { supabaseServer } from './supabase'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log('Authorize: Missing credentials')
            return null
          }

          console.log('Authorize: Attempting to find user:', credentials.email)
          
          // Use Supabase REST API instead of Prisma for serverless compatibility
          // Use server client which bypasses RLS (if using service_role key) or has proper RLS policies
          const { data: users, error } = await supabaseServer
            .from('User')
            .select('id, email, password, name, role, avatar')
            .eq('email', credentials.email)
            .limit(1)

          if (error) {
            console.error('Authorize: Supabase error:', error)
            return null
          }

          if (!users || users.length === 0) {
            console.log('Authorize: User not found')
            return null
          }

          const user = users[0]
          console.log('Authorize: User found, checking password')
          
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            console.log('Authorize: Invalid password')
            return null
          }

          console.log('Authorize: Authentication successful')
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
          }
        } catch (error) {
          console.error('Authorize error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      try {
        if (user) {
          if (user.role) token.role = user.role
          if (user.id) token.id = user.id
          if (user.avatar) token.avatar = user.avatar
        }
        return token
      } catch (error) {
        console.error('JWT callback error:', error)
        return token
      }
    },
    async session({ session, token }) {
      try {
        if (session?.user && token) {
          if (token.role) session.user.role = token.role as string
          if (token.id) session.user.id = token.id as string
          if (token.avatar) session.user.avatar = token.avatar as string
        }
        return session
      } catch (error) {
        console.error('Session callback error:', error)
        return session
      }
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true, // Enable debug in production to see what's happening
}


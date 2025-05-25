import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/db"

// Enhanced logging for authentication debugging
const authLogger = {
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
      console.log(`🔐 [AUTH] ${message}`, data ? JSON.stringify(data, null, 2) : '')
    }
  },
  error: (message: string, error?: any) => {
    console.error(`❌ [AUTH] ${message}`, error)
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        authLogger.debug('Authorization attempt', {
          email: credentials?.email,
          hasPassword: !!credentials?.password
        })

        try {
          // This is a demo implementation - in production, verify credentials properly
          if (credentials?.email === "guest@example.com" && credentials?.password === "guest") {
            authLogger.debug('Guest credentials provided, checking user existence')
            
            // Check if guest user exists
            let user = await prisma.user.findUnique({
              where: { email: "guest@example.com" }
            })

            if (!user) {
              authLogger.debug('Guest user not found, creating new user')
              
              try {
                user = await prisma.user.create({
                  data: {
                    id: "guest-user",
                    email: "guest@example.com",
                    name: "Guest User",
                  }
                })
                authLogger.debug('Guest user created successfully', { userId: user.id })
              } catch (createError) {
                authLogger.error('Failed to create guest user', createError)
                
                // Try to find the user again in case it was created by another process
                user = await prisma.user.findUnique({
                  where: { email: "guest@example.com" }
                })
                
                if (!user) {
                  authLogger.error('Guest user still not found after creation attempt')
                  return null
                }
                authLogger.debug('Found existing guest user after creation error', { userId: user.id })
              }
            } else {
              authLogger.debug('Found existing guest user', { userId: user.id })
            }

            // Ensure user settings exist
            try {
              const existingSettings = await prisma.userSettings.findUnique({
                where: { userId: user.id }
              })
              
              if (!existingSettings) {
                await prisma.userSettings.create({
                  data: {
                    userId: user.id,
                    defaultModel: 'llama3.2',
                    defaultTemperature: 0.7,
                    ollamaUrl: 'http://localhost:11434'
                  }
                })
                authLogger.debug('Created default user settings')
              }
            } catch (settingsError) {
              authLogger.error('Failed to create/check user settings', settingsError)
              // Don't fail auth for settings issues
            }

            const authResult = {
              id: user.id,
              email: user.email,
              name: user.name,
            }
            
            authLogger.debug('Authorization successful', { userId: user.id })
            return authResult
          }
          
          authLogger.debug('Invalid credentials provided')
          return null
          
        } catch (error) {
          authLogger.error('Authorization error', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    session: async ({ session, token }) => {
      authLogger.debug('Session callback', {
        hasSession: !!session,
        hasToken: !!token,
        tokenSub: token?.sub
      })
      
      if (session?.user && token?.sub) {
        session.user.id = token.sub
      }
      return session
    },
    jwt: async ({ user, token }) => {
      authLogger.debug('JWT callback', {
        hasUser: !!user,
        hasToken: !!token,
        userId: user?.id
      })
      
      if (user) {
        token.sub = user.id
      }
      return token
    },
    signIn: async ({ user, account, profile }) => {
      authLogger.debug('SignIn callback', {
        userId: user?.id,
        provider: account?.provider
      })
      return true
    }
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin", // Redirect errors to sign in page
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-secret-for-tests',
  debug: process.env.NODE_ENV === 'development' && !process.env.TEST_MODE,
  // Add custom error handling
  events: {
    signIn: async ({ user, account, profile, isNewUser }) => {
      authLogger.debug('User signed in', { userId: user.id, isNewUser })
    },
    signOut: async (message) => {
      authLogger.debug('User signed out', message)
    },
    createUser: async ({ user }) => {
      authLogger.debug('User created', { userId: user.id })
    },
    session: async ({ session, token }) => {
      authLogger.debug('Session accessed', { userId: session?.user?.id })
    }
  }
})
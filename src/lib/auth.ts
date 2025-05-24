import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/db"

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
        // This is a demo implementation - in production, verify credentials properly
        if (credentials?.email === "guest@example.com" && credentials?.password === "guest") {
          // Check if guest user exists, create if not
          let user = await prisma.user.findUnique({
            where: { email: "guest@example.com" }
          })

          if (!user) {
            user = await prisma.user.create({
              data: {
                id: "guest-user",
                email: "guest@example.com",
                name: "Guest User",
              }
            })
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          }
        }
        return null
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user && token?.sub) {
        session.user.id = token.sub
      }
      return session
    },
    jwt: async ({ user, token }) => {
      if (user) {
        token.sub = user.id
      }
      return token
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
})
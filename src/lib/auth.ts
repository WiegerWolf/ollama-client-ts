import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./db"

export const authOptions: NextAuthOptions = {
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
          return {
            id: "guest-user",
            email: "guest@example.com",
            name: "Guest User",
          }
        }
        return null
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  jwt: {
    encode: async ({ secret, token }) => {
      const jwt = require('jsonwebtoken')
      return jwt.sign(token, secret, { algorithm: 'HS256' })
    },
    decode: async ({ secret, token }) => {
      const jwt = require('jsonwebtoken')
      return jwt.verify(token, secret, { algorithms: ['HS256'] })
    },
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
        token.uid = user.id
      }
      return token
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
}
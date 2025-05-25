import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Enhanced logging for test environment
const getLogLevel = (): ('query' | 'info' | 'warn' | 'error')[] => {
  if (process.env.NODE_ENV === 'test') {
    return ['error', 'warn']
  }
  if (process.env.NODE_ENV === 'development') {
    return ['query', 'error', 'warn']
  }
  return ['error']
}

// Create Prisma client with appropriate configuration
const createPrismaClient = () => {
  const client = new PrismaClient({
    log: getLogLevel(),
    // Add connection pooling configuration for better test stability
    datasources: process.env.DATABASE_URL ? {
      db: {
        url: process.env.DATABASE_URL
      }
    } : undefined,
  })

  return client
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Export a function to create a fresh client for testing
export const createTestPrismaClient = () => {
  return new PrismaClient({
    log: ['error', 'warn'],
    datasources: process.env.DATABASE_URL ? {
      db: {
        url: process.env.DATABASE_URL
      }
    } : undefined,
  })
}
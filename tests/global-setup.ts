import { execSync } from 'child_process'
import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'

async function globalSetup() {
  console.log('🔧 Setting up test environment...')
  
  // Set test database URL with absolute path to avoid conflicts
  const testDbPath = path.resolve(process.cwd(), 'test.db')
  const testDbUrl = `file:${testDbPath}`
  
  // Set environment variables for test
  process.env.DATABASE_URL = testDbUrl
  process.env.AUTH_SECRET = 'test-secret-key-for-e2e-tests'
  process.env.NEXTAUTH_SECRET = 'test-secret-key-for-e2e-tests'
  
  console.log(`📁 Test database path: ${testDbPath}`)
  
  try {
    // Clean up any existing test database files
    const filesToClean = [testDbPath, `${testDbPath}-journal`, `${testDbPath}-wal`, `${testDbPath}-shm`]
    filesToClean.forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file)
        console.log(`🗑️  Cleaned up existing file: ${file}`)
      }
    })
    
    // Create a fresh Prisma client for setup
    const setupPrisma = new PrismaClient({
      datasources: {
        db: {
          url: testDbUrl
        }
      },
      log: ['error', 'warn']
    })
    
    console.log('🔄 Resetting and migrating test database...')
    
    // Reset and migrate the test database
    execSync('bunx prisma migrate reset --force --skip-seed', {
      stdio: 'pipe',
      env: { ...process.env, DATABASE_URL: testDbUrl }
    })
    
    console.log('✅ Database migration completed')
    
    // Wait a moment for database to be ready
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Verify database connection
    await setupPrisma.$connect()
    console.log('🔗 Database connection established')
    
    // Create the guest user for tests
    console.log('👤 Creating guest user...')
    const guestUser = await setupPrisma.user.create({
      data: {
        id: 'guest-user',
        email: 'guest@example.com',
        name: 'Guest User',
      }
    })
    
    console.log(`✅ Guest user created: ${guestUser.email} (ID: ${guestUser.id})`)
    
    // Verify user was created successfully
    const verifyUser = await setupPrisma.user.findUnique({
      where: { email: 'guest@example.com' }
    })
    
    if (!verifyUser) {
      throw new Error('Failed to verify guest user creation')
    }
    
    console.log('✅ Guest user verification successful')
    
    // Create default user settings for the guest user
    await setupPrisma.userSettings.create({
      data: {
        userId: guestUser.id,
        defaultModel: 'llama3.2',
        defaultTemperature: 0.7,
        ollamaUrl: 'http://localhost:11434'
      }
    })
    
    console.log('⚙️  Default user settings created')
    
    // Disconnect the setup client
    await setupPrisma.$disconnect()
    console.log('🔌 Setup database connection closed')
    
    console.log('🎉 Test environment setup complete!')
    
  } catch (error) {
    console.error('❌ Failed to setup test environment:', error)
    
    // Enhanced error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    // Try to clean up on error
    try {
      const cleanupPrisma = new PrismaClient({
        datasources: {
          db: {
            url: testDbUrl
          }
        }
      })
      await cleanupPrisma.$disconnect()
    } catch (cleanupError) {
      console.error('Failed to cleanup on error:', cleanupError)
    }
    
    throw error
  }
}

export default globalSetup
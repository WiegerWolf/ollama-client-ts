import { execSync } from 'child_process'
import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'
import { startMockServer } from './mocks/server'
import { NuclearCleanup } from './utils/nuclear-cleanup'
import { getGlobalDatabaseIsolation } from './utils/database-isolation'

async function globalSetup() {
  console.log('🔧 Setting up test environment...')
  
  // Copy MSW service worker to public directory for browser tests
  console.log('🎭 Setting up MSW service worker...')
  const serviceWorkerSource = path.join(__dirname, '../node_modules/msw/lib/mockServiceWorker.js')
  const serviceWorkerDest = path.join(__dirname, '../public/mockServiceWorker.js')
  
  try {
    if (fs.existsSync(serviceWorkerSource)) {
      fs.copyFileSync(serviceWorkerSource, serviceWorkerDest)
      console.log('✅ MSW service worker copied to public directory')
    } else {
      console.warn('⚠️  MSW service worker not found, trying alternative path...')
      // Try alternative path
      const altSource = path.join(__dirname, '../node_modules/msw/mockServiceWorker.js')
      if (fs.existsSync(altSource)) {
        fs.copyFileSync(altSource, serviceWorkerDest)
        console.log('✅ MSW service worker copied from alternative path')
      } else {
        console.error('❌ MSW service worker not found in any expected location')
      }
    }
  } catch (error) {
    console.warn('⚠️  Failed to copy MSW service worker:', error)
  }
  
  // Start the mock server for API mocking (Node.js side)
  console.log('🎭 Starting mock server...')
  startMockServer()
  
  // Set up database isolation for this test run
  console.log('🔒 Setting up database isolation...')
  const dbIsolation = getGlobalDatabaseIsolation()
  await dbIsolation.setupIsolatedDatabase()
  
  const testDbPath = dbIsolation.getDatabasePath()
  const testDbUrl = dbIsolation.getDatabaseUrl()
  
  // Set environment variables for test
  process.env.DATABASE_URL = testDbUrl
  process.env.AUTH_SECRET = 'test-secret-key-for-e2e-tests-very-long-and-secure'
  process.env.NEXTAUTH_SECRET = 'test-secret-key-for-e2e-tests-very-long-and-secure'
  process.env.NEXTAUTH_URL = 'http://localhost:3000'
  process.env.TEST_MODE = 'true'
  process.env.NEXTAUTH_DEBUG = 'false'
  
  console.log(`📁 Isolated test database: ${testDbPath}`)
  console.log(`🆔 Test run ID: ${dbIsolation.getTestRunId()}`)
  
  try {
    // NUCLEAR RESET: Completely destroy and recreate the database
    console.log('💥 Performing nuclear database reset...')
    const nuclearCleanup = new NuclearCleanup()
    await nuclearCleanup.nuclearReset()
    await nuclearCleanup.disconnect()
    
    console.log('✅ Nuclear reset completed')
    
    // Wait a moment for database to be ready
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Create a fresh Prisma client for setup verification
    const setupPrisma = new PrismaClient({
      datasources: {
        db: {
          url: testDbUrl
        }
      },
      log: ['error', 'warn']
    })
    
    // Verify database connection
    await setupPrisma.$connect()
    console.log('🔗 Database connection established')
    
    // Verify database is completely empty before proceeding
    const verifyCleanup = new NuclearCleanup()
    const initialStats = await verifyCleanup.getDatabaseStats()
    await verifyCleanup.disconnect()
    
    console.log('📊 Initial database state verification:')
    console.log(`   Total records: ${initialStats.total}`)
    
    if (initialStats.total > 0) {
      throw new Error(`Database is not clean! Found ${initialStats.total} records`)
    }
    
    console.log('✅ Database verified as completely empty')
    
    // Use the improved guest user setup script
    console.log('👤 Setting up guest user...')
    const { setupGuestUser } = require('../scripts/setup-guest-user.js')
    
    // Temporarily disconnect the setup client to avoid conflicts
    await setupPrisma.$disconnect()
    
    // Set up guest user with cleanup
    await setupGuestUser()
    
    // Reconnect for final verification
    await setupPrisma.$connect()
    
    // Verify user was created/cleaned successfully
    const verifyUser = await setupPrisma.user.findUnique({
      where: { email: 'guest@example.com' },
      include: {
        conversations: true,
        settings: true
      }
    })
    
    if (!verifyUser) {
      throw new Error('Failed to verify guest user setup')
    }
    
    console.log(`✅ Guest user verified: ${verifyUser.email} (ID: ${verifyUser.id})`)
    console.log(`   Conversations: ${verifyUser.conversations.length}`)
    console.log(`   Settings: ${verifyUser.settings ? 'configured' : 'missing'}`)
    
    // Final database state verification
    const finalVerifyCleanup = new NuclearCleanup()
    const finalStats = await finalVerifyCleanup.getDatabaseStats()
    await finalVerifyCleanup.disconnect()
    
    console.log('📊 Final database state:')
    console.log(`   Users: ${finalStats.users}`)
    console.log(`   Conversations: ${finalStats.conversations}`)
    console.log(`   Messages: ${finalStats.messages}`)
    console.log(`   Total records: ${finalStats.total}`)
    
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
import { execSync } from 'child_process'
import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'

async function globalTeardown() {
  console.log('🧹 Cleaning up test environment...')
  
  try {
    // Get test database path
    const testDbPath = path.resolve(process.cwd(), 'test.db')
    const testDbUrl = `file:${testDbPath}`
    
    // Create cleanup client and disconnect
    const cleanupPrisma = new PrismaClient({
      datasources: {
        db: {
          url: testDbUrl
        }
      }
    })
    
    console.log('🔌 Disconnecting database connections...')
    await cleanupPrisma.$disconnect()
    
    // Wait a moment for connections to close
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Clean up all test database files
    const filesToClean = [
      testDbPath,
      `${testDbPath}-journal`,
      `${testDbPath}-wal`,
      `${testDbPath}-shm`
    ]
    
    let cleanedFiles = 0
    filesToClean.forEach(file => {
      if (fs.existsSync(file)) {
        try {
          fs.unlinkSync(file)
          console.log(`🗑️  Cleaned up: ${path.basename(file)}`)
          cleanedFiles++
        } catch (error) {
          console.warn(`⚠️  Could not remove ${file}:`, error)
        }
      }
    })
    
    console.log(`✅ Test environment cleanup complete (${cleanedFiles} files removed)`)
    
  } catch (error) {
    console.error('❌ Failed to cleanup test environment:', error)
    
    // Enhanced error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message)
    }
    
    // Try alternative cleanup method
    try {
      console.log('🔄 Attempting alternative cleanup...')
      execSync('rm -f test.db test.db-journal test.db-wal test.db-shm', {
        stdio: 'pipe'
      })
      console.log('✅ Alternative cleanup successful')
    } catch (altError) {
      console.error('❌ Alternative cleanup also failed:', altError)
    }
  }
}

export default globalTeardown
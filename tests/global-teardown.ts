import { execSync } from 'child_process'
import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'
import { stopMockServer } from './mocks/server'
import { NuclearCleanup } from './utils/nuclear-cleanup'
import { getGlobalDatabaseIsolation, resetGlobalDatabaseIsolation } from './utils/database-isolation'

async function globalTeardown() {
  console.log('🧹 Cleaning up test environment...')
  
  // Stop the mock server
  console.log('🎭 Stopping mock server...')
  stopMockServer()
  
  // Get database isolation instance
  const dbIsolation = getGlobalDatabaseIsolation()
  console.log(`🆔 Cleaning up test run: ${dbIsolation.getTestRunId()}`)
  
  try {
    // Get database stats before cleanup
    console.log('📊 Getting database stats before cleanup...')
    const preCleanupStats = new NuclearCleanup()
    const beforeStats = await preCleanupStats.getDatabaseStats()
    await preCleanupStats.disconnect()
    
    console.log('📊 Database state before cleanup:')
    console.log(`   Users: ${beforeStats.users}`)
    console.log(`   Conversations: ${beforeStats.conversations}`)
    console.log(`   Messages: ${beforeStats.messages}`)
    console.log(`   Sessions: ${beforeStats.sessions}`)
    console.log(`   Accounts: ${beforeStats.accounts}`)
    console.log(`   User Settings: ${beforeStats.userSettings}`)
    console.log(`   Model Changes: ${beforeStats.modelChanges}`)
    console.log(`   Verification Tokens: ${beforeStats.verificationTokens}`)
    console.log(`   TOTAL RECORDS: ${beforeStats.total}`)
    
    // Clean up isolated database files
    console.log('🗑️  Cleaning up isolated database files...')
    await dbIsolation.cleanupDatabaseFiles()
    
    console.log('✅ Isolated database cleanup completed successfully')
    
    // Reset global database isolation
    resetGlobalDatabaseIsolation()
    
    console.log(`✅ Test environment cleanup complete`)
    
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
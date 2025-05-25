import { stopMockServer } from './mocks/server'
import { cleanupTestDatabase, DatabaseManager } from './utils/database-manager'

async function globalTeardown() {
  console.log('🧹 Cleaning up test environment...')
  
  // Stop the mock server
  console.log('🎭 Stopping mock server...')
  try {
    stopMockServer()
  } catch (error) {
    console.warn('⚠️  Error stopping mock server:', error)
  }
  
  try {
    // Clean up database using consolidated manager
    console.log('🗄️  Cleaning up test database...')
    await cleanupTestDatabase()
    
    // Clean up any leftover test database files
    console.log('🧹 Cleaning up any leftover test database files...')
    await DatabaseManager.cleanupAllTestDatabases()
    
    console.log('✅ Test environment cleanup complete')
    
  } catch (error) {
    console.error('❌ Failed to cleanup test environment:', error)
    
    // Enhanced error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message)
    }
  }
}

export default globalTeardown
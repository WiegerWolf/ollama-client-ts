#!/usr/bin/env node

const { DatabaseManager, initializeTestDatabase, cleanupTestDatabase, resetGuestUserData, validateDatabaseState } = require('../tests/utils/database-manager.ts')

async function testDatabaseManager() {
  console.log('🧪 Testing Database Manager...')
  
  try {
    // Test 1: Initialize database
    console.log('\n1️⃣ Testing database initialization...')
    await initializeTestDatabase()
    console.log('✅ Database initialization successful')
    
    // Test 2: Validate clean state
    console.log('\n2️⃣ Testing clean state validation...')
    await validateDatabaseState()
    console.log('✅ Clean state validation successful')
    
    // Test 3: Get database stats
    console.log('\n3️⃣ Testing database stats...')
    const manager = DatabaseManager.getInstance()
    const stats = await manager.getDatabaseStats()
    console.log('📊 Database stats:', stats)
    console.log('✅ Database stats retrieval successful')
    
    // Test 4: Reset guest user data
    console.log('\n4️⃣ Testing guest user data reset...')
    await resetGuestUserData()
    console.log('✅ Guest user data reset successful')
    
    // Test 5: Validate clean state again
    console.log('\n5️⃣ Testing clean state validation after reset...')
    await validateDatabaseState()
    console.log('✅ Clean state validation after reset successful')
    
    // Test 6: Cleanup
    console.log('\n6️⃣ Testing database cleanup...')
    await cleanupTestDatabase()
    console.log('✅ Database cleanup successful')
    
    console.log('\n🎉 All database manager tests passed!')
    
  } catch (error) {
    console.error('\n❌ Database manager test failed:', error)
    process.exit(1)
  }
}

// Run the test
testDatabaseManager()
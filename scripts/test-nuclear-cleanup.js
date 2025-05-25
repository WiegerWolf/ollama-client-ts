#!/usr/bin/env node

/**
 * Test script to verify the nuclear cleanup solution works properly
 * This script will test the database cleanup and verify it eliminates data pollution
 */

const { PrismaClient } = require('@prisma/client')
const { NuclearCleanup } = require('../tests/utils/nuclear-cleanup.ts')
const { TestCleanup } = require('../tests/utils/test-cleanup.ts')
const path = require('path')

async function main() {
  console.log('🧪 Testing Nuclear Cleanup Solution...')
  console.log('=====================================')
  
  // Set up test database
  const testDbPath = path.resolve(process.cwd(), 'test.db')
  const testDbUrl = `file:${testDbPath}`
  process.env.DATABASE_URL = testDbUrl
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: testDbUrl
      }
    }
  })
  
  const nuclearCleanup = new NuclearCleanup()
  const testCleanup = new TestCleanup()
  
  try {
    // Step 1: Perform nuclear reset to start fresh
    console.log('\n🔥 Step 1: Performing nuclear reset...')
    await nuclearCleanup.nuclearReset()
    
    // Step 2: Verify database is empty
    console.log('\n🔍 Step 2: Verifying database is empty...')
    const emptyStats = await nuclearCleanup.getDatabaseStats()
    console.log(`Total records after nuclear reset: ${emptyStats.total}`)
    
    if (emptyStats.total > 0) {
      throw new Error(`Nuclear reset failed! ${emptyStats.total} records remain`)
    }
    console.log('✅ Nuclear reset successful - database is empty')
    
    // Step 3: Create test data to simulate pollution
    console.log('\n📊 Step 3: Creating test data to simulate pollution...')
    
    // Create multiple users
    const users = []
    for (let i = 1; i <= 5; i++) {
      const user = await prisma.user.create({
        data: {
          id: `test-user-${i}`,
          email: `test${i}@example.com`,
          name: `Test User ${i}`
        }
      })
      users.push(user)
    }
    
    // Create conversations and messages for each user
    let totalConversations = 0
    let totalMessages = 0
    
    for (const user of users) {
      for (let j = 1; j <= 10; j++) {
        const conversation = await prisma.conversation.create({
          data: {
            userId: user.id,
            title: `Test Conversation ${j}`,
            model: 'llama3.2',
            currentModel: 'llama3.2'
          }
        })
        totalConversations++
        
        // Add messages to each conversation
        for (let k = 1; k <= 5; k++) {
          await prisma.message.create({
            data: {
              conversationId: conversation.id,
              role: k % 2 === 0 ? 'user' : 'assistant',
              content: `Test message ${k} in conversation ${j}`,
              model: 'llama3.2'
            }
          })
          totalMessages++
        }
      }
    }
    
    console.log(`Created ${users.length} users, ${totalConversations} conversations, ${totalMessages} messages`)
    
    // Step 4: Verify pollution exists
    console.log('\n🔍 Step 4: Verifying data pollution exists...')
    const pollutedStats = await nuclearCleanup.getDatabaseStats()
    console.log('📊 Database state after creating test data:')
    console.log(`   Users: ${pollutedStats.users}`)
    console.log(`   Conversations: ${pollutedStats.conversations}`)
    console.log(`   Messages: ${pollutedStats.messages}`)
    console.log(`   Total records: ${pollutedStats.total}`)
    
    if (pollutedStats.total === 0) {
      throw new Error('Test data creation failed - no records found')
    }
    console.log('✅ Data pollution successfully created')
    
    // Step 5: Test nuclear data wipe
    console.log('\n💥 Step 5: Testing nuclear data wipe...')
    await nuclearCleanup.nuclearDataWipe()
    
    // Step 6: Verify cleanup worked
    console.log('\n🔍 Step 6: Verifying nuclear data wipe worked...')
    const cleanedStats = await nuclearCleanup.getDatabaseStats()
    console.log('📊 Database state after nuclear data wipe:')
    console.log(`   Users: ${cleanedStats.users}`)
    console.log(`   Conversations: ${cleanedStats.conversations}`)
    console.log(`   Messages: ${cleanedStats.messages}`)
    console.log(`   Total records: ${cleanedStats.total}`)
    
    if (cleanedStats.total > 0) {
      throw new Error(`Nuclear data wipe failed! ${cleanedStats.total} records remain`)
    }
    console.log('✅ Nuclear data wipe successful - all data eliminated')
    
    // Step 7: Test comprehensive cleanup with TestCleanup class
    console.log('\n📊 Step 7: Testing comprehensive cleanup with TestCleanup class...')
    
    // Create more test data
    const testUser = await prisma.user.create({
      data: {
        id: 'comprehensive-test-user',
        email: 'comprehensive@example.com',
        name: 'Comprehensive Test User'
      }
    })
    
    const testConversation = await prisma.conversation.create({
      data: {
        userId: testUser.id,
        title: 'Comprehensive Test Conversation',
        model: 'llama3.2',
        currentModel: 'llama3.2'
      }
    })
    
    await prisma.message.create({
      data: {
        conversationId: testConversation.id,
        role: 'user',
        content: 'Comprehensive test message',
        model: 'llama3.2'
      }
    })
    
    // Test comprehensive cleanup
    await testCleanup.cleanupAllData()
    
    // Verify comprehensive cleanup
    const comprehensiveStats = await testCleanup.getDatabaseStats()
    console.log('📊 Database state after comprehensive cleanup:')
    console.log(`   Total records: ${comprehensiveStats.total}`)
    
    if (comprehensiveStats.total > 0) {
      throw new Error(`Comprehensive cleanup failed! ${comprehensiveStats.total} records remain`)
    }
    console.log('✅ Comprehensive cleanup successful')
    
    // Step 8: Test validation methods
    console.log('\n🔍 Step 8: Testing validation methods...')
    await testCleanup.validateCleanState()
    console.log('✅ Clean state validation passed')
    
    console.log('\n🎉 ALL TESTS PASSED!')
    console.log('=====================================')
    console.log('✅ Nuclear cleanup solution is working correctly')
    console.log('✅ Data pollution issue has been resolved')
    console.log('✅ Database cleanup is comprehensive and reliable')
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message)
    console.error('Stack trace:', error.stack)
    process.exit(1)
  } finally {
    // Cleanup
    await prisma.$disconnect()
    await nuclearCleanup.disconnect()
    await testCleanup.disconnect()
  }
}

// Run the test
main().catch(error => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
})
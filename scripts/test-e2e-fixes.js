#!/usr/bin/env node

const { execSync } = require('child_process')
const path = require('path')

console.log('🧪 Testing E2E fixes...')

// Set environment variables for test
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = `file:${path.resolve(process.cwd(), 'test.db')}`
process.env.AUTH_SECRET = 'test-secret-key-for-e2e-tests-very-long-and-secure'
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-e2e-tests-very-long-and-secure'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.TEST_MODE = 'true'

try {
  console.log('🔧 Setting up test environment...')
  
  console.log('🧪 Running basic chat test...')
  
  // Run a single chat test to validate fixes
  execSync('bun run test:e2e tests/e2e/chat.spec.ts -g "should send and receive messages"', {
    stdio: 'inherit',
    cwd: process.cwd()
  })
  
  console.log('✅ Basic chat test passed')
  
  console.log('🧪 Running conversation management test...')
  
  // Run a single conversation test
  execSync('bun run test:e2e tests/e2e/conversations.spec.ts -g "should create new conversation"', {
    stdio: 'inherit',
    cwd: process.cwd()
  })
  
  console.log('✅ Conversation test passed')
  
  console.log('✅ All tests passed! E2E fixes are working correctly.')
  
} catch (error) {
  console.error('❌ Test failed:', error.message)
  
  // Try to run cleanup even if tests failed
  try {
    console.log('🧹 Running cleanup after failure...')
    // Manual cleanup since global teardown isn't available as separate command
    const fs = require('fs')
    const testDbPath = path.resolve(process.cwd(), 'test.db')
    const filesToClean = [testDbPath, `${testDbPath}-journal`, `${testDbPath}-wal`, `${testDbPath}-shm`]
    filesToClean.forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file)
        console.log(`🗑️  Cleaned up: ${path.basename(file)}`)
      }
    })
  } catch (cleanupError) {
    console.error('❌ Cleanup also failed:', cleanupError.message)
  }
  
  process.exit(1)
}
#!/usr/bin/env node

/**
 * Test script to verify MSW integration fixes
 */

const { execSync } = require('child_process')
const path = require('path')

console.log('🧪 Testing MSW integration fixes...')

try {
  // Run a single chat test to verify MSW is working
  console.log('📝 Running chat test to verify API mocking...')
  
  const result = execSync('bunx playwright test tests/e2e/chat.spec.ts --project=chromium --grep="should send and receive messages"', {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: 'pipe'
  })
  
  console.log('✅ Chat test output:')
  console.log(result)
  
  // Check for MSW-related logs in the output
  if (result.includes('📤 API Request') || result.includes('📥 API Response')) {
    console.log('✅ MSW route interception is working!')
  } else {
    console.log('⚠️  MSW logs not found, but test may have passed')
  }
  
  console.log('🎉 MSW integration test completed successfully!')
  
} catch (error) {
  console.error('❌ MSW integration test failed:')
  console.error(error.stdout || error.message)
  
  // Check if it's a specific MSW-related error
  const output = error.stdout || error.message || ''
  
  if (output.includes('service worker') || output.includes('MSW')) {
    console.error('🔧 This appears to be an MSW-specific issue')
  }
  
  if (output.includes('timeout') || output.includes('navigation')) {
    console.error('⏱️  This appears to be a timeout issue - MSW may not be intercepting requests')
  }
  
  if (output.includes('404') || output.includes('500')) {
    console.error('🌐 API requests are not being mocked properly')
  }
  
  process.exit(1)
}
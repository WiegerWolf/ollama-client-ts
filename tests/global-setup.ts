import { execSync } from 'child_process'
import path from 'path'
import fs from 'fs'
import { initializeTestDatabase } from './utils/database-manager'

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
  
  // Set environment variables for test
  process.env.AUTH_SECRET = 'test-secret-key-for-e2e-tests-very-long-and-secure'
  process.env.NEXTAUTH_SECRET = 'test-secret-key-for-e2e-tests-very-long-and-secure'
  process.env.NEXTAUTH_URL = 'http://localhost:3000'
  process.env.TEST_MODE = 'true'
  process.env.NEXTAUTH_DEBUG = 'false'
  
  try {
    // Initialize database with consolidated manager
    console.log('🗄️  Initializing test database...')
    await initializeTestDatabase()
    
    console.log('🎉 Test environment setup complete!')
    
  } catch (error) {
    console.error('❌ Failed to setup test environment:', error)
    
    // Enhanced error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    throw error
  }
}

export default globalSetup
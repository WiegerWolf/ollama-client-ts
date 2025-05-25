import { execSync } from 'child_process'
import { prisma } from '../src/lib/db'

async function globalSetup() {
  console.log('Setting up test environment...')
  
  // Set test database URL
  process.env.DATABASE_URL = 'file:./test.db'
  process.env.AUTH_SECRET = 'test-secret-key-for-e2e-tests'
  process.env.NEXTAUTH_SECRET = 'test-secret-key-for-e2e-tests'
  
  try {
    // Reset and migrate the test database
    execSync('bunx prisma migrate reset --force --skip-seed', { 
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: 'file:./test.db' }
    })
    
    // Create the guest user for tests
    await prisma.user.create({
      data: {
        id: 'guest-user',
        email: 'guest@example.com',
        name: 'Guest User',
      }
    })
    
    console.log('Test environment setup complete')
  } catch (error) {
    console.error('Failed to setup test environment:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

export default globalSetup
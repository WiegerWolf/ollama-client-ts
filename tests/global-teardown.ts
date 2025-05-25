import { execSync } from 'child_process'
import { prisma } from '../src/lib/db'

async function globalTeardown() {
  console.log('Cleaning up test environment...')
  
  try {
    await prisma.$disconnect()
    
    // Clean up test database
    execSync('rm -f test.db test.db-journal', { stdio: 'inherit' })
    
    console.log('Test environment cleanup complete')
  } catch (error) {
    console.error('Failed to cleanup test environment:', error)
  }
}

export default globalTeardown
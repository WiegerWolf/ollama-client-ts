import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'

export class DatabaseIsolation {
  private testRunId: string
  private testDbPath: string
  private testDbUrl: string

  constructor() {
    // Generate unique test run ID
    this.testRunId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    this.testDbPath = path.resolve(process.cwd(), `test-${this.testRunId}.db`)
    this.testDbUrl = `file:${this.testDbPath}`
  }

  /**
   * Get the unique database URL for this test run
   */
  getDatabaseUrl(): string {
    return this.testDbUrl
  }

  /**
   * Get the unique database path for this test run
   */
  getDatabasePath(): string {
    return this.testDbPath
  }

  /**
   * Get the test run ID
   */
  getTestRunId(): string {
    return this.testRunId
  }

  /**
   * Set up isolated database environment
   */
  async setupIsolatedDatabase(): Promise<void> {
    console.log(`🔒 Setting up isolated database for test run: ${this.testRunId}`)
    console.log(`📁 Database path: ${this.testDbPath}`)
    
    // Set environment variable for this test run
    process.env.DATABASE_URL = this.testDbUrl
    process.env.TEST_RUN_ID = this.testRunId
    
    // Clean up any existing files with this name (shouldn't exist, but just in case)
    await this.cleanupDatabaseFiles()
    
    // Create fresh database with schema
    console.log('🔄 Creating fresh database with schema...')
    execSync('bunx prisma migrate reset --force --skip-seed', {
      stdio: 'pipe',
      env: { ...process.env, DATABASE_URL: this.testDbUrl }
    })
    
    console.log('✅ Isolated database setup complete')
  }

  /**
   * Clean up database files for this test run
   */
  async cleanupDatabaseFiles(): Promise<void> {
    console.log(`🗑️  Cleaning up database files for test run: ${this.testRunId}`)
    
    const filesToClean = [
      this.testDbPath,
      `${this.testDbPath}-journal`,
      `${this.testDbPath}-wal`,
      `${this.testDbPath}-shm`
    ]
    
    let cleanedCount = 0
    
    for (const file of filesToClean) {
      if (fs.existsSync(file)) {
        try {
          fs.unlinkSync(file)
          console.log(`   ✅ Deleted: ${path.basename(file)}`)
          cleanedCount++
        } catch (error) {
          console.warn(`   ⚠️  Could not delete ${file}:`, error)
          
          // Try force deletion
          try {
            execSync(`rm -f "${file}"`, { stdio: 'pipe' })
            console.log(`   ✅ Force deleted: ${path.basename(file)}`)
            cleanedCount++
          } catch (forceError) {
            console.error(`   ❌ Force deletion failed for ${file}:`, forceError)
          }
        }
      }
    }
    
    console.log(`🗑️  Cleaned up ${cleanedCount} database files`)
  }

  /**
   * Clean up all test database files (for maintenance)
   */
  static async cleanupAllTestDatabases(): Promise<void> {
    console.log('🧹 Cleaning up all test database files...')
    
    const currentDir = process.cwd()
    const files = fs.readdirSync(currentDir)
    
    let cleanedCount = 0
    
    for (const file of files) {
      if (file.match(/^test-.*\.db(-journal|-wal|-shm)?$/)) {
        const filePath = path.join(currentDir, file)
        try {
          fs.unlinkSync(filePath)
          console.log(`   ✅ Deleted: ${file}`)
          cleanedCount++
        } catch (error) {
          console.warn(`   ⚠️  Could not delete ${file}:`, error)
        }
      }
    }
    
    console.log(`🗑️  Cleaned up ${cleanedCount} test database files`)
  }

  /**
   * Verify database isolation is working
   */
  async verifyIsolation(): Promise<void> {
    console.log('🔍 Verifying database isolation...')
    
    // Check that we're using the correct database
    if (process.env.DATABASE_URL !== this.testDbUrl) {
      throw new Error(`Database isolation failed: Expected ${this.testDbUrl}, got ${process.env.DATABASE_URL}`)
    }
    
    // Check that database file exists
    if (!fs.existsSync(this.testDbPath)) {
      throw new Error(`Database isolation failed: Database file ${this.testDbPath} does not exist`)
    }
    
    console.log('✅ Database isolation verified')
  }
}

/**
 * Global database isolation instance for the current test run
 */
let globalDatabaseIsolation: DatabaseIsolation | null = null

/**
 * Get or create the global database isolation instance
 */
export function getGlobalDatabaseIsolation(): DatabaseIsolation {
  if (!globalDatabaseIsolation) {
    globalDatabaseIsolation = new DatabaseIsolation()
  }
  return globalDatabaseIsolation
}

/**
 * Reset the global database isolation instance
 */
export function resetGlobalDatabaseIsolation(): void {
  globalDatabaseIsolation = null
}
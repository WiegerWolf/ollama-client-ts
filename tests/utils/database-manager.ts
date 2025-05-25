import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import path from 'path'
import fs from 'fs'

/**
 * Centralized database management for tests
 * Replaces nuclear-cleanup, database-isolation, and test-cleanup
 */
export class DatabaseManager {
  private static instance: DatabaseManager | null = null
  private prisma: PrismaClient
  private testDbPath: string
  private testDbUrl: string
  private testRunId: string

  private constructor() {
    // Use existing test run ID if available, otherwise generate new one
    this.testRunId = process.env.TEST_RUN_ID || `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    this.testDbPath = path.resolve(process.cwd(), `test-${this.testRunId}.db`)
    this.testDbUrl = process.env.DATABASE_URL || `file:${this.testDbPath}`
    
    // Set environment variables for consistency
    process.env.DATABASE_URL = this.testDbUrl
    process.env.TEST_RUN_ID = this.testRunId
    
    console.log(`🔧 DatabaseManager constructor - Test Run ID: ${this.testRunId}`)
    console.log(`🔧 DatabaseManager constructor - Database URL: ${this.testDbUrl}`)
    
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: this.testDbUrl
        }
      },
      log: ['error', 'warn']
    })
  }

  /**
   * Get singleton instance
   */
  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager()
    }
    return DatabaseManager.instance
  }

  /**
   * Reset singleton instance (for testing)
   */
  static resetInstance(): void {
    DatabaseManager.instance = null
  }

  /**
   * Get database URL
   */
  getDatabaseUrl(): string {
    return this.testDbUrl
  }

  /**
   * Get test run ID
   */
  getTestRunId(): string {
    return this.testRunId
  }

  /**
   * Initialize database with fresh schema
   */
  async initializeDatabase(): Promise<void> {
    console.log(`🔧 Initializing database for test run: ${this.testRunId}`)
    console.log(`🔗 Database URL: ${this.testDbUrl}`)
    console.log(`🔗 Process DATABASE_URL: ${process.env.DATABASE_URL}`)
    
    try {
      // Clean up any existing files
      await this.cleanupDatabaseFiles()
      
      // Create fresh database with schema using db push instead of migrate reset
      console.log('🔄 Creating fresh database with schema...')
      console.log('📝 Using prisma db push for fresh schema application...')
      
      const result = execSync('bunx prisma db push --force-reset', {
        stdio: 'pipe',
        env: { ...process.env, DATABASE_URL: this.testDbUrl }
      })
      
      console.log('📋 Prisma db push output:', result.toString())
      
      // Verify database file exists
      if (!fs.existsSync(this.testDbPath)) {
        throw new Error(`Database file was not created at ${this.testDbPath}`)
      }
      console.log('✅ Database file created successfully')
      
      // Connect to verify
      await this.prisma.$connect()
      console.log('✅ Prisma client connected successfully')
      
      // Test a simple query to verify schema
      const userCount = await this.prisma.user.count()
      console.log(`✅ Schema verification: user table accessible (count: ${userCount})`)
      
      console.log('✅ Database initialized successfully')
      
    } catch (error) {
      console.error('❌ Failed to initialize database:', error)
      console.error('❌ Error details:', error instanceof Error ? error.message : String(error))
      
      // Additional debugging
      console.log('🔍 Debug info:')
      console.log(`   Database path: ${this.testDbPath}`)
      console.log(`   Database URL: ${this.testDbUrl}`)
      console.log(`   File exists: ${fs.existsSync(this.testDbPath)}`)
      
      throw error
    }
  }

  /**
   * Set up guest user with clean state
   */
  async setupGuestUser(): Promise<void> {
    console.log('👤 Setting up guest user...')
    
    try {
      // Ensure we're connected
      await this.prisma.$connect()
      
      // Clean up any existing guest user data first
      await this.cleanupGuestUserData()
      
      // Check if guest user exists
      let guestUser = await this.prisma.user.findUnique({
        where: { email: 'guest@example.com' }
      })
      
      if (!guestUser) {
        // Create guest user
        guestUser = await this.prisma.user.create({
          data: {
            id: 'guest-user',
            email: 'guest@example.com',
            name: 'Guest User'
          }
        })
        console.log('   ✅ Created guest user')
      }
      
      // Ensure user settings exist
      const existingSettings = await this.prisma.userSettings.findUnique({
        where: { userId: guestUser.id }
      })
      
      if (!existingSettings) {
        await this.prisma.userSettings.create({
          data: {
            userId: guestUser.id,
            defaultModel: 'llama3.2',
            defaultTemperature: 0.7,
            ollamaUrl: 'http://localhost:11434'
          }
        })
        console.log('   ✅ Created user settings')
      }
      
      console.log('✅ Guest user setup completed')
      
    } catch (error) {
      console.error('❌ Failed to setup guest user:', error)
      throw error
    }
  }

  /**
   * Clean up guest user data only (preserves user and settings)
   */
  async cleanupGuestUserData(): Promise<void> {
    console.log('🧹 Cleaning up guest user data...')
    console.log(`🔗 Using database: ${this.testDbUrl}`)
    
    try {
      await this.prisma.$connect()
      
      // Verify database schema exists before attempting cleanup
      try {
        await this.prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' AND name='Message'`
      } catch (schemaError) {
        console.log('⚠️  Database schema not found, skipping cleanup')
        return
      }
      
      // Delete in correct order to respect foreign key constraints
      const deletedMessages = await this.prisma.message.deleteMany({
        where: {
          conversation: {
            userId: 'guest-user'
          }
        }
      })
      
      const deletedModelChanges = await this.prisma.modelChange.deleteMany({
        where: {
          conversation: {
            userId: 'guest-user'
          }
        }
      })
      
      const deletedConversations = await this.prisma.conversation.deleteMany({
        where: {
          userId: 'guest-user'
        }
      })
      
      const deletedSessions = await this.prisma.session.deleteMany({
        where: {
          userId: 'guest-user'
        }
      })
      
      console.log(`   Deleted: ${deletedMessages.count} messages, ${deletedModelChanges.count} model changes, ${deletedConversations.count} conversations, ${deletedSessions.count} sessions`)
      
    } catch (error) {
      console.error('❌ Failed to cleanup guest user data:', error)
      console.error('❌ Database URL:', this.testDbUrl)
      console.error('❌ Test Run ID:', this.testRunId)
      throw error
    }
  }

  /**
   * Get current database statistics
   */
  async getDatabaseStats(): Promise<{
    users: number
    conversations: number
    messages: number
    sessions: number
    accounts: number
    userSettings: number
    modelChanges: number
    verificationTokens: number
    total: number
  }> {
    try {
      await this.prisma.$connect()
      
      const [
        users,
        conversations,
        messages,
        sessions,
        accounts,
        userSettings,
        modelChanges,
        verificationTokens
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.conversation.count(),
        this.prisma.message.count(),
        this.prisma.session.count(),
        this.prisma.account.count(),
        this.prisma.userSettings.count(),
        this.prisma.modelChange.count(),
        this.prisma.verificationToken.count()
      ])
      
      const total = users + conversations + messages + sessions + 
                   accounts + userSettings + modelChanges + verificationTokens
      
      return {
        users,
        conversations,
        messages,
        sessions,
        accounts,
        userSettings,
        modelChanges,
        verificationTokens,
        total
      }
    } catch (error) {
      console.error('❌ Failed to get database stats:', error)
      throw error
    }
  }

  /**
   * Validate that database is in expected clean state
   * Expected: guest user (1) + user settings (1) = 2 records
   */
  async validateCleanState(): Promise<void> {
    const stats = await this.getDatabaseStats()
    
    console.log('📊 Database state validation:')
    console.log(`   Users: ${stats.users}`)
    console.log(`   Conversations: ${stats.conversations}`)
    console.log(`   Messages: ${stats.messages}`)
    console.log(`   Sessions: ${stats.sessions}`)
    console.log(`   User Settings: ${stats.userSettings}`)
    console.log(`   Total: ${stats.total}`)
    
    // Check for test data pollution
    if (stats.conversations > 0 || stats.messages > 0 || stats.modelChanges > 0 || stats.sessions > 0) {
      throw new Error(`Test data pollution detected: ${stats.conversations} conversations, ${stats.messages} messages, ${stats.modelChanges} model changes, ${stats.sessions} sessions`)
    }
    
    // Verify baseline state
    if (stats.users !== 1 || stats.userSettings !== 1) {
      throw new Error(`Baseline state incorrect: expected 1 user + 1 setting, found ${stats.users} users + ${stats.userSettings} settings`)
    }
    
    console.log('✅ Database state validation passed')
  }

  /**
   * Clean up database files
   */
  async cleanupDatabaseFiles(): Promise<void> {
    const filesToDelete = [
      this.testDbPath,
      `${this.testDbPath}-journal`,
      `${this.testDbPath}-wal`,
      `${this.testDbPath}-shm`
    ]
    
    let deletedCount = 0
    
    for (const file of filesToDelete) {
      if (fs.existsSync(file)) {
        try {
          fs.unlinkSync(file)
          deletedCount++
        } catch (error) {
          // Try force deletion
          try {
            execSync(`rm -f "${file}"`, { stdio: 'pipe' })
            deletedCount++
          } catch (forceError) {
            console.warn(`⚠️  Could not delete ${file}:`, forceError)
          }
        }
      }
    }
    
    if (deletedCount > 0) {
      console.log(`🗑️  Deleted ${deletedCount} database files`)
    }
  }

  /**
   * Disconnect Prisma client
   */
  async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect()
    } catch (error) {
      console.warn('⚠️  Error disconnecting Prisma client:', error)
    }
  }

  /**
   * Complete cleanup - disconnect and remove files
   */
  async cleanup(): Promise<void> {
    console.log(`🧹 Cleaning up database manager for test run: ${this.testRunId}`)
    
    await this.disconnect()
    await this.cleanupDatabaseFiles()
    
    console.log('✅ Database manager cleanup completed')
  }

  /**
   * Clean up all test database files (maintenance function)
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
          cleanedCount++
        } catch (error) {
          console.warn(`⚠️  Could not delete ${file}:`, error)
        }
      }
    }
    
    console.log(`🗑️  Cleaned up ${cleanedCount} test database files`)
  }
}

/**
 * Convenience functions for common operations
 */
export const dbManager = () => DatabaseManager.getInstance()

export async function initializeTestDatabase(): Promise<void> {
  const manager = DatabaseManager.getInstance()
  await manager.initializeDatabase()
  await manager.setupGuestUser()
}

export async function cleanupTestDatabase(): Promise<void> {
  const manager = DatabaseManager.getInstance()
  await manager.cleanup()
  DatabaseManager.resetInstance()
}

export async function resetGuestUserData(): Promise<void> {
  const manager = DatabaseManager.getInstance()
  await manager.cleanupGuestUserData()
}

export async function validateDatabaseState(): Promise<void> {
  const manager = DatabaseManager.getInstance()
  await manager.validateCleanState()
}
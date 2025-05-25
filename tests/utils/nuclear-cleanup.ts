import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import path from 'path'
import fs from 'fs'

export class NuclearCleanup {
  private prisma: PrismaClient
  private testDbPath: string
  private testDbUrl: string

  constructor() {
    // Use the isolated database URL from environment if available, fallback to test.db
    const isolatedDbUrl = process.env.DATABASE_URL
    if (isolatedDbUrl && isolatedDbUrl.startsWith('file:')) {
      this.testDbUrl = isolatedDbUrl
      this.testDbPath = isolatedDbUrl.replace('file:', '')
    } else {
      this.testDbPath = path.resolve(process.cwd(), 'test.db')
      this.testDbUrl = `file:${this.testDbPath}`
    }
    
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
   * Nuclear option: Completely destroy and recreate the database
   */
  async nuclearReset(): Promise<void> {
    console.log('💥 NUCLEAR RESET: Completely destroying test database...')
    
    try {
      // Step 1: Disconnect any existing connections
      await this.forceDisconnectAll()
      
      // Step 2: Delete all database files
      await this.deleteAllDatabaseFiles()
      
      // Step 3: Recreate database with fresh schema
      await this.recreateDatabase()
      
      // Step 4: Verify database is completely empty
      await this.verifyEmptyDatabase()
      
      console.log('✅ Nuclear reset completed successfully')
      
    } catch (error) {
      console.error('❌ Nuclear reset failed:', error)
      throw error
    }
  }

  /**
   * Force disconnect all database connections
   */
  private async forceDisconnectAll(): Promise<void> {
    console.log('🔌 Force disconnecting all database connections...')
    
    try {
      await this.prisma.$disconnect()
    } catch (error) {
      console.warn('⚠️  Error disconnecting Prisma client:', error)
    }
    
    // Wait for connections to close
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  /**
   * Delete all database files (including WAL and journal files)
   */
  private async deleteAllDatabaseFiles(): Promise<void> {
    console.log('🗑️  Deleting all database files...')
    
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
          console.log(`   ✅ Deleted: ${path.basename(file)}`)
          deletedCount++
        } catch (error) {
          console.warn(`   ⚠️  Could not delete ${file}:`, error)
          
          // Try force deletion with system command
          try {
            execSync(`rm -f "${file}"`, { stdio: 'pipe' })
            console.log(`   ✅ Force deleted: ${path.basename(file)}`)
            deletedCount++
          } catch (forceError) {
            console.error(`   ❌ Force deletion failed for ${file}:`, forceError)
          }
        }
      }
    }
    
    console.log(`🗑️  Deleted ${deletedCount} database files`)
  }

  /**
   * Recreate database with fresh schema
   */
  private async recreateDatabase(): Promise<void> {
    console.log('🔄 Recreating database with fresh schema...')
    
    try {
      // Use Prisma migrate to create fresh database
      execSync('bunx prisma migrate reset --force --skip-seed', {
        stdio: 'pipe',
        env: { ...process.env, DATABASE_URL: this.testDbUrl }
      })
      
      console.log('✅ Database recreated successfully')
      
    } catch (error) {
      console.error('❌ Failed to recreate database:', error)
      throw error
    }
  }

  /**
   * Verify that the database is completely empty
   */
  private async verifyEmptyDatabase(): Promise<void> {
    console.log('🔍 Verifying database is completely empty...')
    
    // Create a new client for verification
    const verifyPrisma = new PrismaClient({
      datasources: {
        db: {
          url: this.testDbUrl
        }
      }
    })
    
    try {
      await verifyPrisma.$connect()
      
      // Count all records in all tables
      const [
        userCount,
        conversationCount,
        messageCount,
        sessionCount,
        accountCount,
        userSettingsCount,
        modelChangeCount,
        verificationTokenCount
      ] = await Promise.all([
        verifyPrisma.user.count(),
        verifyPrisma.conversation.count(),
        verifyPrisma.message.count(),
        verifyPrisma.session.count(),
        verifyPrisma.account.count(),
        verifyPrisma.userSettings.count(),
        verifyPrisma.modelChange.count(),
        verifyPrisma.verificationToken.count()
      ])
      
      const totalRecords = userCount + conversationCount + messageCount + 
                          sessionCount + accountCount + userSettingsCount + 
                          modelChangeCount + verificationTokenCount
      
      console.log('📊 Database verification results:')
      console.log(`   Users: ${userCount}`)
      console.log(`   Conversations: ${conversationCount}`)
      console.log(`   Messages: ${messageCount}`)
      console.log(`   Sessions: ${sessionCount}`)
      console.log(`   Accounts: ${accountCount}`)
      console.log(`   User Settings: ${userSettingsCount}`)
      console.log(`   Model Changes: ${modelChangeCount}`)
      console.log(`   Verification Tokens: ${verificationTokenCount}`)
      console.log(`   TOTAL RECORDS: ${totalRecords}`)
      
      if (totalRecords > 0) {
        throw new Error(`Database is not empty! Found ${totalRecords} total records`)
      }
      
      console.log('✅ Database verification passed - completely empty')
      
    } finally {
      await verifyPrisma.$disconnect()
    }
  }

  /**
   * Alternative nuclear cleanup that deletes all data without recreating schema
   */
  async nuclearDataWipe(): Promise<void> {
    console.log('💥 NUCLEAR DATA WIPE: Deleting ALL data from database...')
    
    try {
      await this.prisma.$connect()
      
      // Delete all data in correct order (respecting foreign key constraints)
      console.log('🗑️  Deleting all messages...')
      const deletedMessages = await this.prisma.message.deleteMany({})
      console.log(`   Deleted ${deletedMessages.count} messages`)
      
      console.log('🗑️  Deleting all model changes...')
      const deletedModelChanges = await this.prisma.modelChange.deleteMany({})
      console.log(`   Deleted ${deletedModelChanges.count} model changes`)
      
      console.log('🗑️  Deleting all conversations...')
      const deletedConversations = await this.prisma.conversation.deleteMany({})
      console.log(`   Deleted ${deletedConversations.count} conversations`)
      
      console.log('🗑️  Deleting all user settings...')
      const deletedUserSettings = await this.prisma.userSettings.deleteMany({})
      console.log(`   Deleted ${deletedUserSettings.count} user settings`)
      
      console.log('🗑️  Deleting all sessions...')
      const deletedSessions = await this.prisma.session.deleteMany({})
      console.log(`   Deleted ${deletedSessions.count} sessions`)
      
      console.log('🗑️  Deleting all accounts...')
      const deletedAccounts = await this.prisma.account.deleteMany({})
      console.log(`   Deleted ${deletedAccounts.count} accounts`)
      
      console.log('🗑️  Deleting all verification tokens...')
      const deletedTokens = await this.prisma.verificationToken.deleteMany({})
      console.log(`   Deleted ${deletedTokens.count} verification tokens`)
      
      console.log('🗑️  Deleting all users...')
      const deletedUsers = await this.prisma.user.deleteMany({})
      console.log(`   Deleted ${deletedUsers.count} users`)
      
      // Verify cleanup
      await this.verifyEmptyDatabase()
      
      console.log('✅ Nuclear data wipe completed successfully')
      
    } catch (error) {
      console.error('❌ Nuclear data wipe failed:', error)
      throw error
    }
  }

  /**
   * Get comprehensive database statistics
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
   * Disconnect the Prisma client
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect()
  }
}

/**
 * Convenience function for nuclear reset
 */
export async function performNuclearReset(): Promise<void> {
  const cleanup = new NuclearCleanup()
  try {
    await cleanup.nuclearReset()
  } finally {
    await cleanup.disconnect()
  }
}

/**
 * Convenience function for nuclear data wipe
 */
export async function performNuclearDataWipe(): Promise<void> {
  const cleanup = new NuclearCleanup()
  try {
    await cleanup.nuclearDataWipe()
  } finally {
    await cleanup.disconnect()
  }
}
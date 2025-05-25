import { PrismaClient } from '@prisma/client'
import { NuclearCleanup } from './nuclear-cleanup'

export class TestCleanup {
  private prisma: PrismaClient
  private nuclearCleanup: NuclearCleanup

  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    })
    this.nuclearCleanup = new NuclearCleanup()
  }

  /**
   * NUCLEAR OPTION: Complete database wipe - deletes ALL data regardless of user
   */
  async nuclearWipe(): Promise<void> {
    console.log('💥 NUCLEAR WIPE: Deleting ALL data from database...')
    await this.nuclearCleanup.nuclearDataWipe()
  }

  /**
   * NUCLEAR OPTION: Complete database reset - destroys and recreates database
   */
  async nuclearReset(): Promise<void> {
    console.log('💥 NUCLEAR RESET: Completely destroying and recreating database...')
    await this.nuclearCleanup.nuclearReset()
  }

  /**
   * Comprehensive cleanup that targets ALL conversations, not just guest user ones
   */
  async cleanupAllData(maxRetries = 3): Promise<void> {
    console.log('🧹 Starting comprehensive cleanup of ALL data...')
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Delete ALL data in correct order to respect foreign key constraints
        const deletedMessages = await this.prisma.message.deleteMany({})
        const deletedModelChanges = await this.prisma.modelChange.deleteMany({})
        const deletedConversations = await this.prisma.conversation.deleteMany({})
        const deletedUserSettings = await this.prisma.userSettings.deleteMany({})
        const deletedSessions = await this.prisma.session.deleteMany({})
        const deletedAccounts = await this.prisma.account.deleteMany({})
        const deletedTokens = await this.prisma.verificationToken.deleteMany({})
        const deletedUsers = await this.prisma.user.deleteMany({})
        
        console.log(`   Attempt ${attempt}: Deleted ${deletedMessages.count} messages, ${deletedModelChanges.count} model changes, ${deletedConversations.count} conversations, ${deletedUserSettings.count} user settings, ${deletedSessions.count} sessions, ${deletedAccounts.count} accounts, ${deletedTokens.count} tokens, ${deletedUsers.count} users`)
        
        // Validate cleanup was successful
        const stats = await this.nuclearCleanup.getDatabaseStats()
        
        if (stats.total === 0) {
          console.log(`✅ Comprehensive cleanup successful on attempt ${attempt}`)
          return
        } else {
          console.log(`⚠️  Cleanup incomplete: ${stats.total} total records remain`)
          console.log(`     Users: ${stats.users}, Conversations: ${stats.conversations}, Messages: ${stats.messages}`)
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        }
      } catch (error) {
        console.warn(`⚠️  Cleanup attempt ${attempt} failed:`, error)
        if (attempt === maxRetries) {
          throw error
        }
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    throw new Error(`Failed to cleanup all data after ${maxRetries} attempts`)
  }

  /**
   * Aggressive cleanup with validation and retry mechanism (guest user only)
   */
  async cleanupGuestUserData(maxRetries = 3): Promise<void> {
    console.log('🧹 Starting aggressive guest user data cleanup...')
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
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
        
        console.log(`   Attempt ${attempt}: Deleted ${deletedMessages.count} messages, ${deletedModelChanges.count} model changes, ${deletedConversations.count} conversations, ${deletedSessions.count} sessions`)
        
        // Validate cleanup was successful
        const remainingConversations = await this.prisma.conversation.count({
          where: { userId: 'guest-user' }
        })
        
        const remainingMessages = await this.prisma.message.count({
          where: {
            conversation: {
              userId: 'guest-user'
            }
          }
        })
        
        if (remainingConversations === 0 && remainingMessages === 0) {
          console.log(`✅ Guest user cleanup successful on attempt ${attempt}`)
          return
        } else {
          console.log(`⚠️  Guest user cleanup incomplete: ${remainingConversations} conversations, ${remainingMessages} messages remain`)
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        }
      } catch (error) {
        console.warn(`⚠️  Guest user cleanup attempt ${attempt} failed:`, error)
        if (attempt === maxRetries) {
          throw error
        }
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    throw new Error(`Failed to cleanup guest user data after ${maxRetries} attempts`)
  }

  /**
   * Validate that the test environment is in baseline clean state
   * Baseline state includes: guest user + user settings (2 records)
   */
  async validateCleanState(): Promise<void> {
    console.log('🔍 Validating baseline clean test state...')
    
    const stats = await this.nuclearCleanup.getDatabaseStats()
    
    console.log('📊 Current database state:')
    console.log(`   Users: ${stats.users}`)
    console.log(`   Conversations: ${stats.conversations}`)
    console.log(`   Messages: ${stats.messages}`)
    console.log(`   Sessions: ${stats.sessions}`)
    console.log(`   Accounts: ${stats.accounts}`)
    console.log(`   User Settings: ${stats.userSettings}`)
    console.log(`   Model Changes: ${stats.modelChanges}`)
    console.log(`   Verification Tokens: ${stats.verificationTokens}`)
    console.log(`   TOTAL RECORDS: ${stats.total}`)
    
    // Expected baseline state: guest user (1) + user settings (1) = 2 records
    const expectedBaselineRecords = 2
    const testDataRecords = stats.total - expectedBaselineRecords
    
    // Check for test data pollution (anything beyond baseline)
    if (stats.conversations > 0 || stats.messages > 0 || stats.modelChanges > 0 || stats.sessions > 0) {
      console.warn(`⚠️  Test data pollution detected:`)
      console.warn(`     Conversations: ${stats.conversations}`)
      console.warn(`     Messages: ${stats.messages}`)
      console.warn(`     Model Changes: ${stats.modelChanges}`)
      console.warn(`     Sessions: ${stats.sessions}`)
      throw new Error(`Test environment not clean: ${testDataRecords} test data records found beyond baseline`)
    }
    
    // Verify baseline state is correct
    if (stats.users !== 1 || stats.userSettings !== 1) {
      console.warn(`⚠️  Baseline state incorrect:`)
      console.warn(`     Expected: 1 user, 1 user setting`)
      console.warn(`     Found: ${stats.users} users, ${stats.userSettings} user settings`)
      throw new Error(`Baseline state incorrect: expected 1 user + 1 setting, found ${stats.users} users + ${stats.userSettings} settings`)
    }
    
    console.log('✅ Test environment is in correct baseline state (guest user + settings)')
  }

  /**
   * Validate that guest user data is clean
   */
  async validateGuestUserCleanState(): Promise<void> {
    console.log('🔍 Validating guest user clean state...')
    
    const conversationCount = await this.prisma.conversation.count({
      where: { userId: 'guest-user' }
    })
    
    const messageCount = await this.prisma.message.count({
      where: {
        conversation: {
          userId: 'guest-user'
        }
      }
    })
    
    if (conversationCount > 0 || messageCount > 0) {
      console.warn(`⚠️  Guest user environment not clean: ${conversationCount} conversations, ${messageCount} messages`)
      throw new Error(`Guest user environment not clean: ${conversationCount} conversations, ${messageCount} messages found`)
    }
    
    console.log('✅ Guest user environment is clean')
  }

  /**
   * Enforce conversation count limits to prevent data pollution
   */
  async enforceConversationLimit(maxConversations = 5): Promise<void> {
    const conversationCount = await this.prisma.conversation.count({
      where: { userId: 'guest-user' }
    })
    
    if (conversationCount > maxConversations) {
      console.warn(`⚠️  Too many conversations (${conversationCount}), cleaning up...`)
      await this.cleanupGuestUserData()
    }
  }

  /**
   * Enforce total database size limits to prevent data pollution
   */
  async enforceDatabaseLimit(maxTotalRecords = 10): Promise<void> {
    const stats = await this.nuclearCleanup.getDatabaseStats()
    
    if (stats.total > maxTotalRecords) {
      console.warn(`⚠️  Database too large (${stats.total} records), performing nuclear cleanup...`)
      await this.nuclearWipe()
    }
  }

  /**
   * Get current data counts for debugging (guest user only)
   */
  async getGuestUserDataCounts(): Promise<{
    conversations: number
    messages: number
    modelChanges: number
    sessions: number
  }> {
    const [conversations, messages, modelChanges, sessions] = await Promise.all([
      this.prisma.conversation.count({ where: { userId: 'guest-user' } }),
      this.prisma.message.count({
        where: {
          conversation: {
            userId: 'guest-user'
          }
        }
      }),
      this.prisma.modelChange.count({
        where: {
          conversation: {
            userId: 'guest-user'
          }
        }
      }),
      this.prisma.session.count({ where: { userId: 'guest-user' } })
    ])
    
    return { conversations, messages, modelChanges, sessions }
  }

  /**
   * Get comprehensive database statistics
   */
  async getDatabaseStats() {
    return await this.nuclearCleanup.getDatabaseStats()
  }

  /**
   * Legacy method name for backward compatibility
   */
  async getDataCounts(): Promise<{
    conversations: number
    messages: number
    modelChanges: number
    sessions: number
  }> {
    return await this.getGuestUserDataCounts()
  }

  /**
   * Disconnect all clients
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect()
    await this.nuclearCleanup.disconnect()
  }
}
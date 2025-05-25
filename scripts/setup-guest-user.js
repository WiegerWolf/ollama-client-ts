const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function setupGuestUser() {
  try {
    console.log('🔧 Setting up guest user...')
    
    // Check if guest user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: "guest@example.com" },
      include: {
        conversations: true,
        sessions: true,
        settings: true
      }
    })

    if (existingUser) {
      console.log('👤 Guest user already exists, cleaning up existing data...')
      
      // Clean up existing conversations and related data
      await prisma.message.deleteMany({
        where: {
          conversation: {
            userId: existingUser.id
          }
        }
      })
      console.log('   🗑️  Deleted existing messages')
      
      await prisma.modelChange.deleteMany({
        where: {
          conversation: {
            userId: existingUser.id
          }
        }
      })
      console.log('   🗑️  Deleted existing model changes')
      
      await prisma.conversation.deleteMany({
        where: {
          userId: existingUser.id
        }
      })
      console.log('   🗑️  Deleted existing conversations')
      
      await prisma.session.deleteMany({
        where: {
          userId: existingUser.id
        }
      })
      console.log('   🗑️  Deleted existing sessions')
      
      // Ensure user settings exist
      if (!existingUser.settings) {
        await prisma.userSettings.create({
          data: {
            userId: existingUser.id,
            defaultModel: 'llama3.2',
            defaultTemperature: 0.7,
            ollamaUrl: 'http://localhost:11434'
          }
        })
        console.log('   ⚙️  Created default user settings')
      }
      
      console.log('✅ Guest user cleanup completed')
      return existingUser
    }

    // Create guest user
    console.log('👤 Creating new guest user...')
    const guestUser = await prisma.user.create({
      data: {
        id: "guest-user",
        email: "guest@example.com",
        name: "Guest User",
      }
    })

    // Create default user settings
    await prisma.userSettings.create({
      data: {
        userId: guestUser.id,
        defaultModel: 'llama3.2',
        defaultTemperature: 0.7,
        ollamaUrl: 'http://localhost:11434'
      }
    })

    console.log('✅ Guest user created successfully:', guestUser)
    return guestUser
  } catch (error) {
    console.error('❌ Error setting up guest user:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Only run if called directly (not when imported)
if (require.main === module) {
  setupGuestUser()
}

module.exports = { setupGuestUser }
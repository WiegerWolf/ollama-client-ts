const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function setupGuestUser() {
  try {
    // Check if guest user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: "guest@example.com" }
    })

    if (existingUser) {
      console.log('Guest user already exists:', existingUser)
      return
    }

    // Create guest user
    const guestUser = await prisma.user.create({
      data: {
        id: "guest-user",
        email: "guest@example.com",
        name: "Guest User",
      }
    })

    console.log('Guest user created successfully:', guestUser)
  } catch (error) {
    console.error('Error setting up guest user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupGuestUser()
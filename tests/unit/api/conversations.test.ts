import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/conversations/route'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { mockConversations } from '../../mocks/data'

// Mock dependencies
jest.mock('@/lib/auth')
jest.mock('@/lib/db')

const mockAuth = auth as jest.MockedFunction<typeof auth>
const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('/api/conversations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock authenticated session
    mockAuth.mockResolvedValue({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
      },
    } as any)
  })

  describe('GET /api/conversations', () => {
    it('should return conversations for authenticated user', async () => {
      mockPrisma.conversation.findMany = jest.fn().mockResolvedValue(mockConversations)

      const request = new NextRequest('http://localhost:3000/api/conversations')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockConversations)
      expect(mockPrisma.conversation.findMany).toHaveBeenCalledWith({
        where: { userId: 'test-user-id' },
        include: {
          _count: {
            select: {
              messages: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      })
    })

    it('should return 401 when user is not authenticated', async () => {
      mockAuth.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/conversations')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should handle database errors', async () => {
      mockPrisma.conversation.findMany = jest.fn().mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/conversations')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should return empty array when user has no conversations', async () => {
      mockPrisma.conversation.findMany = jest.fn().mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/conversations')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([])
    })
  })

  describe('POST /api/conversations', () => {
    it('should create new conversation', async () => {
      const newConversation = {
        id: 'new-conv-id',
        title: 'New Conversation',
        model: 'llama3.2',
        currentModel: 'llama3.2',
        userId: 'test-user-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.conversation.create = jest.fn().mockResolvedValue(newConversation)

      const request = new NextRequest('http://localhost:3000/api/conversations', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Conversation',
          model: 'llama3.2',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toEqual(newConversation)
      expect(mockPrisma.conversation.create).toHaveBeenCalledWith({
        data: {
          title: 'New Conversation',
          model: 'llama3.2',
          currentModel: 'llama3.2',
          userId: 'test-user-id',
        },
      })
    })

    it('should create conversation with default values', async () => {
      const newConversation = {
        id: 'new-conv-id',
        title: 'New Conversation',
        model: 'llama3.2',
        currentModel: 'llama3.2',
        userId: 'test-user-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.conversation.create = jest.fn().mockResolvedValue(newConversation)

      const request = new NextRequest('http://localhost:3000/api/conversations', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(mockPrisma.conversation.create).toHaveBeenCalledWith({
        data: {
          title: 'New Conversation',
          model: 'llama3.2',
          currentModel: 'llama3.2',
          userId: 'test-user-id',
        },
      })
    })

    it('should return 401 when user is not authenticated', async () => {
      mockAuth.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/conversations', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Conversation',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should handle database errors during creation', async () => {
      mockPrisma.conversation.create = jest.fn().mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/conversations', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Conversation',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should handle invalid JSON in request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/conversations', {
        method: 'POST',
        body: 'invalid json',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request body')
    })
  })

  describe('Request validation', () => {
    it('should handle missing request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/conversations', {
        method: 'POST',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request body')
    })

    it('should sanitize title input', async () => {
      const newConversation = {
        id: 'new-conv-id',
        title: 'Clean Title',
        model: 'llama3.2',
        currentModel: 'llama3.2',
        userId: 'test-user-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.conversation.create = jest.fn().mockResolvedValue(newConversation)

      const request = new NextRequest('http://localhost:3000/api/conversations', {
        method: 'POST',
        body: JSON.stringify({
          title: '  Clean Title  ',
          model: 'llama3.2',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(mockPrisma.conversation.create).toHaveBeenCalledWith({
        data: {
          title: 'Clean Title',
          model: 'llama3.2',
          currentModel: 'llama3.2',
          userId: 'test-user-id',
        },
      })
    })

    it('should reject extremely long titles', async () => {
      const longTitle = 'a'.repeat(1000)

      const request = new NextRequest('http://localhost:3000/api/conversations', {
        method: 'POST',
        body: JSON.stringify({
          title: longTitle,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Title too long')
    })
  })

  describe('Performance', () => {
    it('should handle large number of conversations efficiently', async () => {
      const largeConversationList = Array.from({ length: 1000 }, (_, i) => ({
        ...mockConversations[0],
        id: `conv-${i}`,
        title: `Conversation ${i}`,
      }))

      mockPrisma.conversation.findMany = jest.fn().mockResolvedValue(largeConversationList)

      const request = new NextRequest('http://localhost:3000/api/conversations')
      const startTime = Date.now()
      
      const response = await GET(request)
      const data = await response.json()
      
      const endTime = Date.now()
      const duration = endTime - startTime

      expect(response.status).toBe(200)
      expect(data).toHaveLength(1000)
      expect(duration).toBeLessThan(1000) // Should complete within 1 second
    })
  })
})
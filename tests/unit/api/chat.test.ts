import { NextRequest } from 'next/server'
import { POST } from '@/app/api/chat/route'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Mock dependencies
jest.mock('@/lib/auth')
jest.mock('@/lib/db')
jest.mock('@/lib/utils')

const mockAuth = auth as jest.MockedFunction<typeof auth>
const mockPrisma = prisma as jest.Mocked<typeof prisma>

// Mock fetch for Ollama requests
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('/api/chat', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock authenticated session
    ;(mockAuth as any).mockResolvedValue({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
      },
    })

    // Mock environment variable
    process.env.OLLAMA_BASE_URL = 'http://localhost:11434'
  })

  afterEach(() => {
    delete process.env.OLLAMA_BASE_URL
  })

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      ;(mockAuth as any).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          model: 'llama3.2',
          messages: [{ role: 'user', content: 'Hello' }],
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('Request Validation', () => {
    it('should return 400 when model is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing required fields')
    })

    it('should return 400 when messages are missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          model: 'llama3.2',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing required fields')
    })

    it('should return 400 when messages array is empty', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          model: 'llama3.2',
          messages: [],
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing required fields')
    })
  })

  describe('Non-streaming Response', () => {
    it('should handle successful non-streaming response', async () => {
      const mockOllamaResponse = {
        message: {
          role: 'assistant',
          content: 'Hello! How can I help you?',
        },
        done: true,
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockOllamaResponse,
      } as Response)

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          model: 'llama3.2',
          messages: [{ role: 'user', content: 'Hello' }],
          stream: false,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockOllamaResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/chat',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama3.2',
            messages: [{ role: 'user', content: 'Hello' }],
            stream: false,
          }),
        })
      )
    })

    it('should include temperature in request when provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ message: { role: 'assistant', content: 'Response' }, done: true }),
      } as Response)

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          model: 'llama3.2',
          messages: [{ role: 'user', content: 'Hello' }],
          temperature: 0.8,
          stream: false,
        }),
      })

      await POST(request)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/chat',
        expect.objectContaining({
          body: JSON.stringify({
            model: 'llama3.2',
            messages: [{ role: 'user', content: 'Hello' }],
            stream: false,
            options: { temperature: 0.8 },
          }),
        })
      )
    })
  })

  describe('Streaming Response', () => {
    it('should handle successful streaming response', async () => {
      const chunks = [
        '{"message":{"role":"assistant","content":"Hello"},"done":false}',
        '{"message":{"role":"assistant","content":" there"},"done":false}',
        '{"done":true}',
      ]

      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          chunks.forEach(chunk => {
            controller.enqueue(encoder.encode(chunk + '\n'))
          })
          controller.close()
        }
      })

      mockFetch.mockResolvedValue({
        ok: true,
        body: stream,
      } as Response)

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          model: 'llama3.2',
          messages: [{ role: 'user', content: 'Hello' }],
          stream: true,
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('text/plain')
      expect(response.headers.get('Cache-Control')).toBe('no-cache')
      expect(response.headers.get('Connection')).toBe('keep-alive')

      // Test that we can read the stream
      const reader = response.body?.getReader()
      expect(reader).toBeDefined()
    })
  })

  describe('Database Integration', () => {
    beforeEach(() => {
      // Mock Prisma operations
      mockPrisma.conversation.findFirst = jest.fn().mockResolvedValue({
        id: 'conv-1',
        model: 'llama3.2',
        title: 'Test Conversation',
        _count: { messages: 0 },
      })

      mockPrisma.$transaction = jest.fn().mockImplementation(async (callback) => {
        const mockTx = {
          message: {
            create: jest.fn().mockResolvedValue({}),
          },
          conversation: {
            update: jest.fn().mockResolvedValue({}),
          },
        }
        return callback(mockTx)
      })
    })

    it('should save messages to database for non-streaming response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          message: { role: 'assistant', content: 'Response' },
          done: true,
        }),
      } as Response)

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          model: 'llama3.2',
          messages: [{ role: 'user', content: 'Hello' }],
          conversationId: 'conv-1',
          stream: false,
        }),
      })

      await POST(request)

      expect(mockPrisma.conversation.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'conv-1',
          userId: 'test-user-id',
        },
        include: {
          _count: {
            select: {
              messages: true,
            },
          },
        },
      })

      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle Ollama server errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      } as Response)

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          model: 'llama3.2',
          messages: [{ role: 'user', content: 'Hello' }],
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Ollama server error')
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          model: 'llama3.2',
          messages: [{ role: 'user', content: 'Hello' }],
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should handle request cancellation', async () => {
      const abortError = new Error('Request aborted')
      abortError.name = 'AbortError'
      mockFetch.mockRejectedValue(abortError)

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          model: 'llama3.2',
          messages: [{ role: 'user', content: 'Hello' }],
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(499)
      expect(data.error).toBe('Request cancelled')
      expect(data.cancelled).toBe(true)
    })
  })

  describe('Request Cancellation', () => {
    it('should handle client disconnection', async () => {
      // Mock fetch to reject with AbortError
      const abortError = new Error('Request aborted')
      abortError.name = 'AbortError'
      mockFetch.mockRejectedValue(abortError)

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          model: 'llama3.2',
          messages: [{ role: 'user', content: 'Hello' }],
        }),
      })

      const response = await POST(request)
      const data = await response.json()
      
      // The request should be cancelled
      expect(response.status).toBe(499)
      expect(data.error).toBe('Request cancelled')
      expect(data.cancelled).toBe(true)
    })
  })
})
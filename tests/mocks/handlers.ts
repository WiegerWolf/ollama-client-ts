import { http, HttpResponse } from 'msw'
import { mockConversations, mockModels, mockUserSettings, mockApiResponses } from './data'

export const handlers = [
  // Auth endpoints
  http.get('/api/auth/session', () => {
    console.log('🔐 MSW: Handling auth session request')
    return HttpResponse.json({
      user: {
        id: 'guest-user',
        email: 'guest@example.com',
        name: 'Guest User',
      },
      expires: '2024-12-31',
    })
  }),

  // Conversations endpoints
  http.get('/api/conversations', ({ request }) => {
    console.log('💬 MSW: Handling conversations GET request')
    const url = new URL(request.url)
    const search = url.searchParams.get('search')
    
    // Handle search functionality
    if (search) {
      console.log(`🔍 MSW: Searching conversations for: ${search}`)
      const filtered = mockConversations.filter(conv =>
        conv.title.toLowerCase().includes(search.toLowerCase()) ||
        conv.messages.some(msg => msg.content.toLowerCase().includes(search.toLowerCase()))
      )
      return HttpResponse.json(filtered)
    }
    
    // Return all conversations by default
    console.log(`💬 MSW: Returning ${mockConversations.length} conversations`)
    return HttpResponse.json(mockConversations)
  }),

  http.get('/api/conversations/:id', ({ params }) => {
    const { id } = params
    const conversation = mockConversations.find(conv => conv.id === id)
    
    if (!conversation) {
      return new HttpResponse(null, { status: 404 })
    }
    
    return HttpResponse.json(conversation)
  }),

  http.post('/api/conversations', async ({ request }) => {
    const body = await request.json() as any
    const newConversation = {
      id: `conv-${Date.now()}`,
      title: body.title || 'New Conversation',
      model: body.model || 'llama3.2',
      currentModel: body.model || 'llama3.2',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
      modelChanges: [],
      _count: { messages: 0 },
    }
    
    return HttpResponse.json(newConversation, { status: 201 })
  }),

  http.put('/api/conversations/:id', async ({ params, request }) => {
    const { id } = params
    const body = await request.json() as any
    const conversation = mockConversations.find(conv => conv.id === id)
    
    if (!conversation) {
      return new HttpResponse(null, { status: 404 })
    }
    
    const updatedConversation = {
      ...conversation,
      ...body,
      updatedAt: new Date().toISOString(),
    }
    
    return HttpResponse.json(updatedConversation)
  }),

  http.delete('/api/conversations/:id', ({ params }) => {
    const { id } = params
    const conversation = mockConversations.find(conv => conv.id === id)
    
    if (!conversation) {
      return new HttpResponse(null, { status: 404 })
    }
    
    return new HttpResponse(null, { status: 204 })
  }),

  // Conversation model endpoints
  http.put('/api/conversations/:id/model', async ({ params, request }) => {
    const { id } = params
    const body = await request.json() as any
    const conversation = mockConversations.find(conv => conv.id === id)
    
    if (!conversation) {
      return new HttpResponse(null, { status: 404 })
    }
    
    const updatedConversation = {
      ...conversation,
      currentModel: body.model,
      updatedAt: new Date().toISOString(),
    }
    
    return HttpResponse.json(updatedConversation)
  }),

  // Models endpoint
  http.get('/api/models', () => {
    console.log('🤖 MSW: Handling models GET request')
    return HttpResponse.json({ models: mockModels })
  }),

  // User settings endpoints
  http.get('/api/user/settings', () => {
    return HttpResponse.json(mockUserSettings)
  }),

  http.put('/api/user/settings', async ({ request }) => {
    const body = await request.json() as any
    const updatedSettings = {
      ...mockUserSettings,
      ...body,
      updatedAt: new Date().toISOString(),
    }
    
    return HttpResponse.json(updatedSettings)
  }),

  // Chat endpoint with improved streaming for tests
  http.post('/api/chat', async ({ request }) => {
    console.log('💬 MSW: Handling chat POST request')
    const body = await request.json() as any
    const { stream = true, messages } = body
    
    if (!messages || messages.length === 0) {
      console.log('❌ MSW: Chat request missing messages')
      return HttpResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Check for special test scenarios based on message content
    const lastMessage = messages[messages.length - 1]?.content || ''
    console.log(`💬 MSW: Processing chat message: ${lastMessage.substring(0, 50)}...`)
    
    // Handle markdown test
    if (lastMessage.includes('markdown')) {
      const response = '{"message":{"role":"assistant","content":"**Bold text** and *italic text*\\n\\n```javascript\\nconsole.log(\\"Hello\\");\\n```"},"done":true}'
      return new HttpResponse(response, {
        headers: { 'Content-Type': 'text/plain' }
      })
    }
    
    // Handle thinking test
    if (lastMessage.includes('think')) {
      const response = '{"message":{"role":"assistant","content":"<thinking>\\nLet me think about this...\\n</thinking>\\n\\nHere is my response."},"done":true}'
      return new HttpResponse(response, {
        headers: { 'Content-Type': 'text/plain' }
      })
    }
    
    // Handle error simulation
    if (lastMessage.includes('error')) {
      return HttpResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
    
    // Handle network error simulation
    if (lastMessage.includes('network')) {
      return HttpResponse.error()
    }
    
    // Handle cancellation test (slow response)
    if (lastMessage.includes('cancel')) {
      // Simulate slow response
      await new Promise(resolve => setTimeout(resolve, 5000))
      return HttpResponse.json(
        { error: 'Request cancelled', cancelled: true },
        { status: 499 }
      )
    }
    
    if (stream) {
      // Return streaming response optimized for test environment
      const responseBody = '{"message":{"role":"assistant","content":"Hello there! How can I help you?"},"done":true}'
      
      return new HttpResponse(responseBody, {
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    } else {
      // Return non-streaming response
      return HttpResponse.json(mockApiResponses.chat.success)
    }
  }),

  // Error simulation endpoints for testing
  http.get('/api/conversations/error', () => {
    return HttpResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }),

  http.get('/api/models/error', () => {
    return HttpResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    )
  }),

  http.post('/api/chat/error', () => {
    return HttpResponse.json(
      { error: 'Chat service unavailable' },
      { status: 503 }
    )
  }),

  // Unauthorized endpoints for testing auth
  http.get('/api/conversations/unauthorized', () => {
    return HttpResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }),
]

// Handlers for different test scenarios
export const errorHandlers = [
  http.get('/api/conversations', () => {
    return HttpResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }),
  
  http.get('/api/models', () => {
    return HttpResponse.json(
      { error: 'Service unavailable' },
      { status: 503 }
    )
  }),
]

export const emptyHandlers = [
  http.get('/api/conversations', () => {
    return HttpResponse.json([])
  }),
  
  http.get('/api/models', () => {
    return HttpResponse.json({ models: [] })
  }),
]
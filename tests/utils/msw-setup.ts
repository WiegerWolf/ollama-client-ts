import { Page } from '@playwright/test'

/**
 * Setup API mocking using Playwright's route interception
 * This provides reliable API mocking for Playwright e2e tests
 */
export async function setupMSWInBrowser(page: Page): Promise<void> {
  console.log('🎭 Setting up API route interception...')
  
  // Add request/response logging for debugging
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      console.log(`📤 API Request: ${request.method()} ${request.url()}`)
    }
  })
  
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      console.log(`📥 API Response: ${response.status()} ${response.url()}`)
    }
  })
  
  // Intercept auth session requests
  await page.route('/api/auth/session', async route => {
    console.log('🔐 Intercepting auth session request')
    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: {
          id: 'guest-user',
          email: 'guest@example.com',
          name: 'Guest User'
        },
        expires: '2024-12-31'
      })
    })
  })
  
  // Intercept models requests
  await page.route('/api/models', async route => {
    console.log('🤖 Intercepting models request')
    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        models: [
          {
            name: 'llama3.2',
            size: 2048000000,
            digest: 'sha256:abc123',
            modified_at: '2024-01-01T00:00:00Z',
            details: {
              format: 'gguf',
              family: 'llama',
              families: ['llama'],
              parameter_size: '3B',
              quantization_level: 'Q4_0'
            }
          }
        ]
      })
    })
  })
  
  // Intercept conversations list requests
  await page.route('/api/conversations', async route => {
    console.log(`💬 Intercepting conversations ${route.request().method()} request`)
    
    if (route.request().method() === 'GET') {
      const url = new URL(route.request().url())
      const search = url.searchParams.get('search')
      
      // Return empty array for now (tests will create conversations as needed)
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([])
      })
    } else if (route.request().method() === 'POST') {
      const body = await route.request().postDataJSON()
      await route.fulfill({
        status: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `conv-${Date.now()}`,
          title: body?.title || 'New Conversation',
          model: body?.model || 'llama3.2',
          currentModel: body?.model || 'llama3.2',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: [],
          modelChanges: [],
          _count: { messages: 0 }
        })
      })
    }
  })
  
  // Intercept individual conversation requests
  await page.route('/api/conversations/*', async route => {
    const url = route.request().url()
    const conversationId = url.split('/conversations/')[1]?.split('/')[0]
    
    console.log(`💬 Intercepting conversation ${route.request().method()} request for ID: ${conversationId}`)
    
    if (route.request().method() === 'GET') {
      // Return a mock conversation
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: conversationId,
          title: 'Test Conversation',
          model: 'llama3.2',
          currentModel: 'llama3.2',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: [],
          modelChanges: [],
          _count: { messages: 0 }
        })
      })
    } else if (route.request().method() === 'PUT') {
      const body = await route.request().postDataJSON()
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: conversationId,
          title: body?.title || 'Updated Conversation',
          model: body?.model || 'llama3.2',
          currentModel: body?.currentModel || body?.model || 'llama3.2',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: [],
          modelChanges: [],
          _count: { messages: 0 }
        })
      })
    } else if (route.request().method() === 'DELETE') {
      await route.fulfill({
        status: 204,
        headers: { 'Content-Type': 'application/json' },
        body: ''
      })
    }
  })
  
  // Intercept user settings requests
  await page.route('/api/user/settings', async route => {
    console.log(`⚙️ Intercepting user settings ${route.request().method()} request`)
    
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'settings-1',
          userId: 'guest-user',
          theme: 'system',
          defaultModel: 'llama3.2',
          streamingEnabled: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      })
    } else if (route.request().method() === 'PUT') {
      const body = await route.request().postDataJSON()
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'settings-1',
          userId: 'guest-user',
          ...body,
          updatedAt: new Date().toISOString()
        })
      })
    }
  })
  
  // Intercept chat requests
  await page.route('/api/chat', async route => {
    const request = route.request()
    const body = await request.postDataJSON()
    const lastMessage = body?.messages?.[body.messages.length - 1]?.content || ''
    
    console.log('💬 Intercepting chat request with message:', lastMessage.substring(0, 50) + '...')
    
    // Handle special test scenarios based on message content
    if (lastMessage.includes('markdown')) {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
        body: '{"message":{"role":"assistant","content":"**Bold text** and *italic text*\\n\\n```javascript\\nconsole.log(\\"Hello\\");\\n```"},"done":true}'
      })
      return
    }
    
    if (lastMessage.includes('think')) {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
        body: '{"message":{"role":"assistant","content":"<thinking>\\nLet me think about this...\\n</thinking>\\n\\nHere is my response."},"done":true}'
      })
      return
    }
    
    if (lastMessage.includes('error')) {
      await route.fulfill({
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Internal server error' })
      })
      return
    }
    
    if (lastMessage.includes('network')) {
      await route.abort('failed')
      return
    }
    
    if (lastMessage.includes('cancel')) {
      // Simulate slow response for cancellation tests
      await new Promise(resolve => setTimeout(resolve, 2000))
      await route.fulfill({
        status: 499,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Request cancelled', cancelled: true })
      })
      return
    }
    
    // Default streaming response that matches test expectations
    const chunks = [
      '{"message":{"role":"assistant","content":"Hello there! How can I help you?"},"done":true}'
    ]
    
    await route.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      },
      body: chunks.join('\n')
    })
  })
  
  console.log('✅ API route interception setup complete')
}

/**
 * Reset API route handlers
 */
export async function resetMSWInBrowser(page: Page): Promise<void> {
  console.log('🔄 Resetting API route handlers...')
  // Playwright routes are automatically reset between tests
  // This function is kept for compatibility with existing test code
}

/**
 * Stop API mocking (cleanup)
 */
export async function stopMSWInBrowser(page: Page): Promise<void> {
  console.log('🛑 Stopping API route interception...')
  // Playwright routes are automatically cleaned up when page is closed
  // This function is kept for compatibility with existing test code
}
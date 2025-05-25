import { Page } from '@playwright/test'

/**
 * Setup API mocking using Playwright's route interception
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
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([])
      })
    } else if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `conv-${Date.now()}`,
          title: 'New Conversation',
          model: 'llama3.2',
          currentModel: 'llama3.2',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: [],
          modelChanges: [],
          _count: { messages: 0 }
        })
      })
    }
  })
  
  // Intercept chat requests
  await page.route('/api/chat', async route => {
    const request = route.request()
    const body = await request.postDataJSON()
    const lastMessage = body?.messages?.[body.messages.length - 1]?.content || ''
    
    console.log('🎭 Intercepting chat request with message:', lastMessage)
    
    // Handle special test scenarios
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
    
    // Default response
    const chunks = [
      '{"message":{"role":"assistant","content":"Hello"},"done":false}',
      '{"message":{"role":"assistant","content":" there"},"done":false}',
      '{"message":{"role":"assistant","content":"!"},"done":false}',
      '{"message":{"role":"assistant","content":" How"},"done":false}',
      '{"message":{"role":"assistant","content":" can"},"done":false}',
      '{"message":{"role":"assistant","content":" I"},"done":false}',
      '{"message":{"role":"assistant","content":" help"},"done":false}',
      '{"message":{"role":"assistant","content":" you"},"done":false}',
      '{"message":{"role":"assistant","content":"?"},"done":false}',
      '{"done":true}'
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
  // Playwright routes are automatically reset between tests
  console.log('🔄 API routes will be reset automatically')
}
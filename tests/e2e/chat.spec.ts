import { test, expect } from '@playwright/test'

test.describe('Chat Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in as guest user
    await page.goto('/auth/signin')
    await page.getByLabel(/email/i).fill('guest@example.com')
    await page.getByLabel(/password/i).fill('guest')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Wait for redirect to main app
    await expect(page).toHaveURL('/')
  })

  test('should send and receive messages', async ({ page }) => {
    // Mock the chat API response
    await page.route('/api/chat', async route => {
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
        '{"done":true}',
      ]
      
      const stream = new ReadableStream({
        start(controller) {
          chunks.forEach((chunk, index) => {
            setTimeout(() => {
              controller.enqueue(new TextEncoder().encode(chunk + '\n'))
              if (index === chunks.length - 1) {
                controller.close()
              }
            }, index * 50)
          })
        }
      })
      
      route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
        body: stream,
      })
    })

    // Type a message
    const messageInput = page.getByPlaceholderText(/type your message/i)
    await messageInput.fill('Hello, how are you?')
    
    // Send the message
    await page.getByRole('button', { name: /send/i }).click()
    
    // Should see the user message
    await expect(page.getByText('Hello, how are you?')).toBeVisible()
    
    // Should see streaming indicator
    await expect(page.getByText(/ai is typing/i)).toBeVisible()
    
    // Should see the assistant response
    await expect(page.getByText('Hello there! How can I help you?')).toBeVisible()
    
    // Input should be cleared
    await expect(messageInput).toHaveValue('')
  })

  test('should handle message cancellation', async ({ page }) => {
    // Mock a slow chat API response
    await page.route('/api/chat', async route => {
      // Simulate a slow response that can be cancelled
      await new Promise(resolve => setTimeout(resolve, 5000))
      route.fulfill({
        status: 499,
        body: JSON.stringify({ error: 'Request cancelled', cancelled: true }),
      })
    })

    // Type and send a message
    await page.getByPlaceholderText(/type your message/i).fill('Test message')
    await page.getByRole('button', { name: /send/i }).click()
    
    // Should show streaming indicator
    await expect(page.getByText(/ai is typing/i)).toBeVisible()
    
    // Should show cancel button
    const cancelButton = page.getByRole('button', { name: /cancel/i })
    await expect(cancelButton).toBeVisible()
    
    // Click cancel button
    await cancelButton.click()
    
    // Should show cancellation message
    await expect(page.getByText(/response cancelled/i)).toBeVisible()
    
    // Streaming indicator should disappear
    await expect(page.getByText(/ai is typing/i)).not.toBeVisible()
  })

  test('should handle keyboard shortcuts', async ({ page }) => {
    const messageInput = page.getByPlaceholderText(/type your message/i)
    
    // Test Enter to send
    await messageInput.fill('Test message')
    await messageInput.press('Enter')
    
    // Should send the message (input cleared)
    await expect(messageInput).toHaveValue('')
    
    // Test Shift+Enter for new line
    await messageInput.fill('Line 1')
    await messageInput.press('Shift+Enter')
    await messageInput.type('Line 2')
    
    // Should have multiline content
    await expect(messageInput).toHaveValue('Line 1\nLine 2')
  })

  test('should show message timestamps', async ({ page }) => {
    // Send a message first
    await page.getByPlaceholderText(/type your message/i).fill('Test message')
    await page.getByRole('button', { name: /send/i }).click()
    
    // Should show timestamp
    await expect(page.getByText(/just now|ago/)).toBeVisible()
  })

  test('should display model badges', async ({ page }) => {
    // Should show model badge for messages
    await expect(page.getByText('llama3.2')).toBeVisible()
  })

  test('should handle markdown rendering', async ({ page }) => {
    // Mock response with markdown
    await page.route('/api/chat', route => {
      const response = '{"message":{"role":"assistant","content":"**Bold text** and *italic text*\\n\\n```javascript\\nconsole.log(\\"Hello\\");\\n```"},"done":true}'
      route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
        body: response,
      })
    })

    await page.getByPlaceholderText(/type your message/i).fill('Show me some markdown')
    await page.getByRole('button', { name: /send/i }).click()
    
    // Should render bold text
    await expect(page.locator('strong').filter({ hasText: 'Bold text' })).toBeVisible()
    
    // Should render italic text
    await expect(page.locator('em').filter({ hasText: 'italic text' })).toBeVisible()
    
    // Should render code block
    await expect(page.locator('code').filter({ hasText: 'console.log("Hello");' })).toBeVisible()
  })

  test('should handle thinking sections', async ({ page }) => {
    // Mock response with thinking section
    await page.route('/api/chat', route => {
      const response = '{"message":{"role":"assistant","content":"<thinking>\\nLet me think about this...\\n</thinking>\\n\\nHere is my response."},"done":true}'
      route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
        body: response,
      })
    })

    await page.getByPlaceholderText(/type your message/i).fill('Think about something')
    await page.getByRole('button', { name: /send/i }).click()
    
    // Should show thinking section toggle
    await expect(page.getByRole('button', { name: /show thinking/i })).toBeVisible()
    
    // Click to expand thinking section
    await page.getByRole('button', { name: /show thinking/i }).click()
    
    // Should show thinking content
    await expect(page.getByText('Let me think about this...')).toBeVisible()
  })

  test('should handle error states', async ({ page }) => {
    // Mock API error
    await page.route('/api/chat', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal server error' }),
      })
    })

    await page.getByPlaceholderText(/type your message/i).fill('Test message')
    await page.getByRole('button', { name: /send/i }).click()
    
    // Should show error message
    await expect(page.getByText(/error occurred/i)).toBeVisible()
  })

  test('should handle network errors', async ({ page }) => {
    // Mock network failure
    await page.route('/api/chat', route => {
      route.abort('failed')
    })

    await page.getByPlaceholderText(/type your message/i).fill('Test message')
    await page.getByRole('button', { name: /send/i }).click()
    
    // Should show network error
    await expect(page.getByText(/network error/i)).toBeVisible()
  })

  test('should auto-scroll to bottom on new messages', async ({ page }) => {
    // Add multiple messages to create scrollable content
    for (let i = 0; i < 10; i++) {
      await page.getByPlaceholderText(/type your message/i).fill(`Message ${i + 1}`)
      await page.getByRole('button', { name: /send/i }).click()
      await page.waitForTimeout(100) // Small delay between messages
    }
    
    // Should be scrolled to bottom
    const messagesContainer = page.locator('[data-testid="messages-container"]')
    const isAtBottom = await messagesContainer.evaluate(el => {
      return el.scrollTop + el.clientHeight >= el.scrollHeight - 10
    })
    expect(isAtBottom).toBe(true)
  })

  test('should handle empty messages', async ({ page }) => {
    const sendButton = page.getByRole('button', { name: /send/i })
    
    // Send button should be disabled when input is empty
    await expect(sendButton).toBeDisabled()
    
    // Type whitespace only
    await page.getByPlaceholderText(/type your message/i).fill('   ')
    
    // Send button should still be disabled
    await expect(sendButton).toBeDisabled()
  })

  test('should maintain focus on input after sending', async ({ page }) => {
    const messageInput = page.getByPlaceholderText(/type your message/i)
    
    await messageInput.fill('Test message')
    await page.getByRole('button', { name: /send/i }).click()
    
    // Input should regain focus after sending
    await expect(messageInput).toBeFocused()
  })

  test('should be accessible', async ({ page }) => {
    // Check ARIA labels
    await expect(page.getByLabelText(/message input/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /send message/i })).toBeVisible()
    
    // Check keyboard navigation
    await page.keyboard.press('Tab')
    await expect(page.getByPlaceholderText(/type your message/i)).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: /send/i })).toBeFocused()
    
    // Check screen reader announcements
    await expect(page.getByRole('status')).toBeVisible()
  })

  test('should handle rapid message sending', async ({ page }) => {
    // Mock quick responses
    await page.route('/api/chat', route => {
      route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
        body: '{"message":{"role":"assistant","content":"Quick response"},"done":true}',
      })
    })

    const messageInput = page.getByPlaceholderText(/type your message/i)
    const sendButton = page.getByRole('button', { name: /send/i })
    
    // Send multiple messages quickly
    for (let i = 0; i < 3; i++) {
      await messageInput.fill(`Quick message ${i + 1}`)
      await sendButton.click()
      await page.waitForTimeout(50)
    }
    
    // Should handle all messages without errors
    await expect(page.getByText('Quick message 1')).toBeVisible()
    await expect(page.getByText('Quick message 2')).toBeVisible()
    await expect(page.getByText('Quick message 3')).toBeVisible()
  })
})
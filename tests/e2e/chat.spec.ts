import { test, expect } from '@playwright/test'
import { signInAsGuest, waitForChatInterfaceReady, waitForInputEnabled, waitForSendButtonEnabled, sendMessage } from '../utils/auth-helpers'
import { dbManager, resetGuestUserData, validateDatabaseState } from '../utils/database-manager'
import { setupMSWInBrowser } from '../utils/msw-setup'

test.describe('Chat Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Setup MSW in browser for API mocking
    await setupMSWInBrowser(page)
    
    // Clean up guest user data before each test
    await resetGuestUserData()
    
    // Validate clean state before proceeding
    await validateDatabaseState()

    // Sign in as guest user and ensure chat interface is ready
    await signInAsGuest(page)
    await waitForChatInterfaceReady(page)
    
    // Log current data counts for debugging
    const stats = await dbManager().getDatabaseStats()
    console.log(`📊 Pre-test data counts:`, stats)
  })

  test.afterEach(async ({ page }) => {
    // Log final data counts for debugging
    const stats = await dbManager().getDatabaseStats()
    console.log(`📊 Post-test data counts:`, stats)
    
    // Clear browser storage and cookies after each test
    await page.context().clearCookies()
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    
    // Clean up any conversations created during the test
    await resetGuestUserData()
  })

  test('should send and receive messages', async ({ page }) => {
    console.log('🧪 Testing message sending and receiving...')
    
    // MSW will handle the API mocking automatically

    // Wait for input to be enabled before interacting
    console.log('⏳ Waiting for message input to be enabled...')
    const messageInput = await waitForInputEnabled(page, 15000)
    
    // Type a message
    console.log('📝 Typing message...')
    await messageInput.fill('Hello, how are you?')
    
    // Wait for send button to be enabled
    console.log('⏳ Waiting for send button to be enabled...')
    const sendButton = await waitForSendButtonEnabled(page)
    
    // Send the message
    console.log('📤 Sending message...')
    await sendButton.click()
    
    // Should see the user message
    console.log('🔍 Checking for user message...')
    await expect(page.getByText('Hello, how are you?')).toBeVisible({ timeout: 10000 })
    
    // Check if typing indicator appears (optional - may be too fast to catch)
    console.log('🔍 Checking for streaming indicator (optional)...')
    try {
      await expect(page.locator('[data-testid="ai-typing-indicator"]')).toBeVisible({ timeout: 2000 })
      console.log('✅ Typing indicator appeared')
    } catch {
      console.log('⚠️  Typing indicator not visible (response may be too fast)')
    }
    
    // Should see the assistant response
    console.log('🔍 Checking for assistant response...')
    await expect(page.getByText('Hello there! How can I help you?')).toBeVisible({ timeout: 15000 })
    
    // Input should be cleared and re-enabled
    console.log('🔍 Checking input state...')
    await expect(messageInput).toHaveValue('')
    await expect(messageInput).toBeEnabled({ timeout: 5000 })
    
    console.log('✅ Message sending and receiving test passed')
  })

  test('should handle message cancellation', async ({ page }) => {
    // MSW will handle the slow response based on message content
    
    // Type and send a message with "cancel" keyword to trigger slow response
    await page.getByTestId('message-input').fill('Test cancel message')
    await page.getByTestId('send-button').click()
    
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
    await expect(page.locator('[data-testid="ai-typing-indicator"]')).not.toBeVisible()
  })

  test('should handle keyboard shortcuts', async ({ page }) => {
    const messageInput = page.getByTestId('message-input')
    
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
    await page.getByTestId('message-input').fill('Test message')
    await page.getByTestId('send-button').click()
    
    // Should show timestamp
    await expect(page.getByText(/just now|ago/)).toBeVisible()
  })

  test('should display model badges', async ({ page }) => {
    // Should show model badge for messages
    await expect(page.getByText('llama3.2')).toBeVisible()
  })

  test('should handle markdown rendering', async ({ page }) => {
    // MSW will handle markdown response based on message content
    
    await page.getByTestId('message-input').fill('Show me some markdown')
    await page.getByTestId('send-button').click()
    
    // Should render bold text
    await expect(page.locator('strong').filter({ hasText: 'Bold text' })).toBeVisible()
    
    // Should render italic text
    await expect(page.locator('em').filter({ hasText: 'italic text' })).toBeVisible()
    
    // Should render code block
    await expect(page.locator('code').filter({ hasText: 'console.log("Hello");' })).toBeVisible()
  })

  test('should handle thinking sections', async ({ page }) => {
    // MSW will handle thinking response based on message content
    
    await page.getByTestId('message-input').fill('Think about something')
    await page.getByTestId('send-button').click()
    
    // Should show thinking section toggle
    await expect(page.getByRole('button', { name: /show thinking/i })).toBeVisible()
    
    // Click to expand thinking section
    await page.getByRole('button', { name: /show thinking/i }).click()
    
    // Should show thinking content
    await expect(page.getByText('Let me think about this...')).toBeVisible()
  })

  test('should handle error states', async ({ page }) => {
    // MSW will handle error response based on message content
    
    await page.getByTestId('message-input').fill('Test error message')
    await page.getByTestId('send-button').click()
    
    // Should show error message
    await expect(page.getByText(/error occurred/i)).toBeVisible()
  })

  test('should handle network errors', async ({ page }) => {
    // MSW will handle network error based on message content
    
    await page.getByTestId('message-input').fill('Test network message')
    await page.getByTestId('send-button').click()
    
    // Should show network error
    await expect(page.getByText(/network error/i)).toBeVisible()
  })

  test('should auto-scroll to bottom on new messages', async ({ page }) => {
    console.log('🧪 Testing auto-scroll functionality...')
    
    // MSW will handle quick responses automatically
    
    // Add multiple messages to create scrollable content
    for (let i = 0; i < 5; i++) {
      console.log(`📤 Sending message ${i + 1} for scroll test...`)
      
      // Wait for input to be enabled
      const messageInput = await waitForInputEnabled(page, 10000)
      await messageInput.fill(`Message ${i + 1}`)
      
      // Wait for send button and click
      const sendButton = await waitForSendButtonEnabled(page, 5000)
      await sendButton.click()
      
      // Wait for the message to appear
      await expect(page.getByText(`Message ${i + 1}`)).toBeVisible({ timeout: 10000 })
      
      // Wait for input to be re-enabled before next iteration
      await expect(messageInput).toBeEnabled({ timeout: 10000 })
      
      // Small delay to ensure UI updates
      await page.waitForTimeout(200)
    }
    
    // Should be scrolled to bottom
    console.log('🔍 Checking scroll position...')
    const messagesContainer = page.locator('[data-testid="messages-container"]')
    await expect(messagesContainer).toBeVisible()
    
    const isAtBottom = await messagesContainer.evaluate(el => {
      return el.scrollTop + el.clientHeight >= el.scrollHeight - 20 // Allow for small margin
    })
    expect(isAtBottom).toBe(true)
    
    console.log('✅ Auto-scroll test passed')
  })

  test('should handle empty messages', async ({ page }) => {
    const sendButton = page.getByTestId('send-button')
    
    // Send button should be disabled when input is empty
    await expect(sendButton).toBeDisabled()
    
    // Type whitespace only
    await page.getByTestId('message-input').fill('   ')
    
    // Send button should still be disabled
    await expect(sendButton).toBeDisabled()
  })

  test('should maintain focus on input after sending', async ({ page }) => {
    console.log('🧪 Testing focus management...')
    
    // MSW will handle quick response automatically
    
    // Wait for input to be enabled and focused
    const messageInput = await waitForInputEnabled(page, 10000)
    
    console.log('📝 Filling and sending message...')
    await messageInput.fill('Test message')
    
    const sendButton = await waitForSendButtonEnabled(page, 5000)
    await sendButton.click()
    
    // Wait for message to appear
    await expect(page.getByText('Test message')).toBeVisible({ timeout: 10000 })
    
    // Wait for input to be re-enabled
    await expect(messageInput).toBeEnabled({ timeout: 10000 })
    
    // Input should regain focus after sending (with timeout for focus to return)
    console.log('🔍 Checking focus management...')
    await expect(messageInput).toBeFocused({ timeout: 5000 })
    
    console.log('✅ Focus management test passed')
  })

  test('should be accessible', async ({ page }) => {
    // Check ARIA labels
    await expect(page.getByTestId('message-input')).toBeVisible()
    await expect(page.getByTestId('send-button')).toBeVisible()
    
    // Check keyboard navigation
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('message-input')).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('send-button')).toBeFocused()
    
    // Check screen reader announcements
    await expect(page.getByRole('status')).toBeVisible()
  })

  test('should handle rapid message sending', async ({ page }) => {
    console.log('🧪 Testing rapid message sending...')
    
    // MSW will handle quick responses automatically

    // Send multiple messages quickly with proper waiting
    for (let i = 0; i < 3; i++) {
      console.log(`📤 Sending quick message ${i + 1}...`)
      
      // Wait for input to be enabled before each message
      const messageInput = await waitForInputEnabled(page, 10000)
      await messageInput.fill(`Quick message ${i + 1}`)
      
      // Wait for send button to be enabled
      const sendButton = await waitForSendButtonEnabled(page, 5000)
      await sendButton.click()
      
      // Wait for the message to appear before sending the next one
      await expect(page.getByText(`Quick message ${i + 1}`)).toBeVisible({ timeout: 10000 })
      
      // Wait for input to be re-enabled (indicating the previous message is complete)
      await expect(messageInput).toBeEnabled({ timeout: 10000 })
      
      // Small delay to ensure UI state is stable
      await page.waitForTimeout(100)
    }
    
    // Should handle all messages without errors
    console.log('🔍 Verifying all messages are visible...')
    await expect(page.getByText('Quick message 1')).toBeVisible()
    await expect(page.getByText('Quick message 2')).toBeVisible()
    await expect(page.getByText('Quick message 3')).toBeVisible()
    
    console.log('✅ Rapid message sending test passed')
  })
})
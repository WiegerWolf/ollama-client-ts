import { Page, expect } from '@playwright/test'

/**
 * Helper function to sign in as guest user with retry mechanism
 */
export async function signInAsGuest(page: Page, retries = 3): Promise<void> {
  console.log('🔐 Signing in as guest user...')
  
  while (retries > 0) {
    try {
      await page.goto('/auth/signin', { waitUntil: 'networkidle', timeout: 30000 })
      
      // Wait for form elements to be ready
      await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 10000 })
      await expect(page.getByLabel(/password/i)).toBeVisible({ timeout: 10000 })
      
      const emailInput = page.getByLabel(/email/i)
      const passwordInput = page.getByLabel(/password/i)
      
      await emailInput.fill('guest@example.com')
      await expect(emailInput).toHaveValue('guest@example.com')
      
      await passwordInput.fill('guest')
      await expect(passwordInput).toHaveValue('guest')
      
      const signInButton = page.getByRole('button', { name: /sign in/i })
      await expect(signInButton).toBeEnabled()
      await signInButton.click()
      
      // Wait for authentication to complete
      await Promise.race([
        page.waitForURL('/', { timeout: 30000 }),
        page.waitForURL(/\/conversation\//, { timeout: 30000 })
      ])
      
      console.log('✅ Authentication successful')
      return
    } catch (error) {
      retries--
      console.warn(`⚠️  Authentication failed, retries left: ${retries}`, error)
      if (retries === 0) throw error
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
}

/**
 * Helper function to wait for UI elements to be enabled using specific test IDs
 */
export async function waitForInputEnabled(page: Page, timeout = 10000) {
  // Use data-testid for more reliable selection, fallback to generic selector
  let messageInput = page.locator('[data-testid="message-input"]')
  
  try {
    await expect(messageInput).toBeVisible({ timeout: 2000 })
  } catch {
    // Fallback to generic selector if testid not found
    messageInput = page.locator('input[placeholder*="type your message" i], textarea[placeholder*="type your message" i]')
  }
  
  await expect(messageInput).toBeVisible({ timeout })
  await expect(messageInput).toBeEnabled({ timeout })
  return messageInput
}

/**
 * Helper function to wait for send button to be enabled using specific test ID
 */
export async function waitForSendButtonEnabled(page: Page, timeout = 5000) {
  // Use data-testid for more reliable selection, fallback to generic selector
  let sendButton = page.locator('[data-testid="send-button"]')
  
  try {
    await expect(sendButton).toBeVisible({ timeout: 2000 })
  } catch {
    // Fallback to generic selector if testid not found
    sendButton = page.getByRole('button', { name: /send/i })
  }
  
  await expect(sendButton).toBeVisible({ timeout })
  await expect(sendButton).toBeEnabled({ timeout })
  return sendButton
}

/**
 * Helper function to ensure chat interface is ready
 */
export async function waitForChatInterfaceReady(page: Page): Promise<void> {
  console.log('⏳ Waiting for chat interface to be ready...')
  
  // If redirected to a conversation, go to home page to start fresh
  if (page.url().includes('/conversation/')) {
    console.log('🔄 Redirected to conversation, navigating to home...')
    await page.goto('/', { waitUntil: 'networkidle' })
  }
  
  // Wait for chat interface to be ready
  const messageInput = await waitForInputEnabled(page, 15000)
  console.log('✅ Chat interface ready')
  return
}

/**
 * Helper function to send a message with proper waiting
 */
export async function sendMessage(page: Page, message: string): Promise<void> {
  console.log(`📤 Sending message: "${message}"`)
  
  const messageInput = await waitForInputEnabled(page, 10000)
  await messageInput.fill(message)
  
  const sendButton = await waitForSendButtonEnabled(page, 5000)
  await sendButton.click()
  
  // Wait for the message to appear
  await expect(page.getByText(message)).toBeVisible({ timeout: 10000 })
  
  // Wait for input to be re-enabled
  await expect(messageInput).toBeEnabled({ timeout: 10000 })
  
  console.log('✅ Message sent successfully')
}
import { test, expect } from '@playwright/test'
import { dbManager, resetGuestUserData, validateDatabaseState } from '../utils/database-manager'
import { setupMSWInBrowser } from '../utils/msw-setup'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Setup MSW in browser for API mocking
    await setupMSWInBrowser(page)
    
    // Clean up guest user data before each test
    await resetGuestUserData()
    
    // Validate clean state before proceeding
    await validateDatabaseState()

    // Enhanced error logging for authentication debugging
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.text().includes('[AUTH]') || msg.text().includes('Failed to fetch')) {
        console.log(`🖥️  Browser console [${msg.type()}]: ${msg.text()}`)
      }
    })
    
    // Enhanced request/response logging for auth endpoints
    page.on('request', request => {
      if (request.url().includes('/api/auth/') || request.url().includes('/_next/static/chunks/')) {
        console.log(`📤 Request: ${request.method()} ${request.url()}`)
      }
    })
    
    page.on('response', response => {
      if (response.url().includes('/api/auth/') || (response.status() >= 400 && response.url().includes('/_next/'))) {
        console.log(`📥 Response: ${response.status()} ${response.url()}`)
        if (response.status() >= 400) {
          console.log(`❌ Error response details: ${response.statusText()}`)
        }
      }
    })

    // Handle page errors
    page.on('pageerror', error => {
      console.error(`🚨 Page error: ${error.message}`)
    })

    // Handle request failures
    page.on('requestfailed', request => {
      console.error(`🚨 Request failed: ${request.method()} ${request.url()} - ${request.failure()?.errorText}`)
    })
    
    // Start from the home page with retry mechanism
    let retries = 3
    while (retries > 0) {
      try {
        await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 })
        break
      } catch (error) {
        retries--
        console.warn(`⚠️  Failed to navigate to home page, retries left: ${retries}`, error)
        if (retries === 0) throw error
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  })

  test.afterEach(async ({ page }) => {
    // Clear browser storage and cookies after each test
    await page.context().clearCookies()
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    
    // Clean up any conversations created during the test
    await resetGuestUserData()
  })

  test('should redirect unauthenticated users to sign in', async ({ page }) => {
    console.log('🧪 Testing unauthenticated redirect...')
    
    // Clear any existing session data
    await page.context().clearCookies()
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    
    // Override MSW to return unauthenticated response
    await page.route('/api/auth/session', route => {
      console.log('🔐 Intercepting auth session request - returning unauthenticated')
      route.fulfill({
        status: 200,
        body: JSON.stringify({})
      })
    })
    
    // Navigate to home page
    await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 })
    
    // Should be redirected to sign in page
    await expect(page).toHaveURL(/\/auth\/signin/, { timeout: 15000 })
    
    // Should show sign in form
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible({ timeout: 10000 })
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    
    console.log('✅ Unauthenticated redirect test passed')
  })

  test('should allow guest user to sign in', async ({ page }) => {
    console.log('🧪 Testing guest user sign in...')
    
    // Navigate to sign in page with retry
    let retries = 3
    while (retries > 0) {
      try {
        await page.goto('/auth/signin', { waitUntil: 'networkidle', timeout: 30000 })
        break
      } catch (error) {
        retries--
        console.warn(`⚠️  Failed to navigate to sign in page, retries left: ${retries}`)
        if (retries === 0) throw error
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    // Wait for form to be ready with enhanced checks
    console.log('⏳ Waiting for sign in form...')
    const emailInput = page.getByLabel(/email/i)
    const passwordInput = page.getByLabel(/password/i)
    
    await expect(emailInput).toBeVisible({ timeout: 15000 })
    await expect(passwordInput).toBeVisible({ timeout: 10000 })
    
    // Fill in guest credentials with verification
    console.log('📝 Filling in guest credentials...')
    await emailInput.fill('guest@example.com')
    await expect(emailInput).toHaveValue('guest@example.com')
    
    await passwordInput.fill('guest')
    await expect(passwordInput).toHaveValue('guest')
    
    // Click sign in button and wait for navigation
    console.log('🔐 Clicking sign in button...')
    const signInButton = page.getByRole('button', { name: /sign in/i })
    await expect(signInButton).toBeEnabled()
    
    // Use Promise.race to handle both success and potential errors
    const authPromise = Promise.race([
      page.waitForURL('/', { timeout: 45000 }),
      page.waitForURL(/\/conversation\//, { timeout: 45000 })
    ])
    
    await signInButton.click()
    
    // Wait for authentication to complete
    console.log('⏳ Waiting for authentication...')
    
    try {
      await authPromise
      console.log(`✅ Authentication successful, current URL: ${page.url()}`)
    } catch (error) {
      console.error(`❌ Authentication failed: ${error}`)
      // Check if we're still on sign in page (authentication failed)
      if (page.url().includes('/auth/signin')) {
        throw new Error('Authentication failed - still on sign in page')
      }
      throw error
    }
    
    // If redirected to a conversation, go to home page to check the interface
    if (page.url().includes('/conversation/')) {
      console.log('🔄 Redirected to conversation, navigating to home...')
      await page.goto('/', { waitUntil: 'networkidle' })
    }
    
    // Should show main chat interface
    console.log('🔍 Checking for main chat interface...')
    
    // Wait for either "Start your first conversation" or message input to be visible
    await Promise.race([
      expect(page.getByTestId('start-conversation-button')).toBeVisible({ timeout: 15000 }),
      expect(page.getByTestId('message-input')).toBeVisible({ timeout: 15000 })
    ])
    
    // Verify message input is present and enabled
    const messageInput = page.getByTestId('message-input')
    await expect(messageInput).toBeVisible({ timeout: 10000 })
    await expect(messageInput).toBeEnabled({ timeout: 5000 })
    
    console.log('✅ Guest user sign in test passed')
  })

  test('should reject invalid credentials', async ({ page }) => {
    console.log('🧪 Testing invalid credentials rejection...')
    
    await page.goto('/auth/signin')
    await page.waitForLoadState('networkidle')
    
    // Fill in invalid credentials
    console.log('📝 Filling in invalid credentials...')
    await page.getByLabel(/email/i).fill('invalid@example.com')
    await page.getByLabel(/password/i).fill('wrongpassword')
    
    // Click sign in button
    console.log('🔐 Clicking sign in with invalid credentials...')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Wait for error handling
    await page.waitForTimeout(2000)
    
    // Should show error message or remain on sign in page
    const isOnSignInPage = await page.locator('h1, h2').filter({ hasText: /sign in/i }).isVisible()
    expect(isOnSignInPage).toBe(true)
    
    // Should remain on sign in page
    await expect(page).toHaveURL(/\/auth\/signin/)
    
    console.log('✅ Invalid credentials rejection test passed')
  })

  test('should maintain session across page reloads', async ({ page }) => {
    console.log('🧪 Testing session persistence across reloads...')
    
    // Sign in first
    await page.goto('/auth/signin')
    await page.waitForLoadState('networkidle')
    
    console.log('📝 Signing in...')
    await page.getByLabel(/email/i).fill('guest@example.com')
    await page.getByLabel(/password/i).fill('guest')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Wait for redirect to main app
    console.log('⏳ Waiting for redirect...')
    await page.waitForURL('/', { timeout: 30000 })
    
    // Reload the page
    console.log('🔄 Reloading page...')
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Should still be authenticated and on main app
    console.log('🔍 Checking session persistence...')
    await expect(page).toHaveURL('/', { timeout: 15000 })
    await expect(page.getByTestId('message-input')).toBeVisible({ timeout: 15000 })
    
    console.log('✅ Session persistence test passed')
  })

  test('should handle session expiration', async ({ page }) => {
    console.log('🧪 Testing session expiration handling...')
    
    // Sign in first
    await page.goto('/auth/signin')
    await page.waitForLoadState('networkidle')
    
    console.log('📝 Signing in...')
    await page.getByLabel(/email/i).fill('guest@example.com')
    await page.getByLabel(/password/i).fill('guest')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    await page.waitForURL('/', { timeout: 30000 })
    
    // Simulate session expiration by clearing cookies
    console.log('🍪 Clearing cookies to simulate session expiration...')
    await page.context().clearCookies()
    
    // Try to navigate to a protected page
    console.log('🔒 Navigating to protected page...')
    await page.goto('/conversation/test-id')
    
    // Should be redirected to sign in
    await expect(page).toHaveURL(/\/auth\/signin/, { timeout: 15000 })
    
    console.log('✅ Session expiration test passed')
  })

  test('should be accessible', async ({ page }) => {
    console.log('🧪 Testing accessibility...')
    
    await page.goto('/auth/signin')
    await page.waitForLoadState('networkidle')
    
    // Check for proper heading structure
    const heading = page.getByRole('heading', { name: /sign in/i })
    await expect(heading).toBeVisible({ timeout: 10000 })
    
    // Check for proper form labels
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    
    // Check keyboard navigation
    console.log('⌨️  Testing keyboard navigation...')
    await page.keyboard.press('Tab')
    await expect(page.getByLabel(/email/i)).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.getByLabel(/password/i)).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: /sign in/i })).toBeFocused()
    
    console.log('✅ Accessibility test passed')
  })
})
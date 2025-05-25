import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Add console logging for debugging
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.text().includes('[AUTH]')) {
        console.log(`🖥️  Browser console: ${msg.text()}`)
      }
    })
    
    // Add request/response logging for auth endpoints
    page.on('request', request => {
      if (request.url().includes('/api/auth/')) {
        console.log(`📤 Auth request: ${request.method()} ${request.url()}`)
      }
    })
    
    page.on('response', response => {
      if (response.url().includes('/api/auth/')) {
        console.log(`📥 Auth response: ${response.status()} ${response.url()}`)
      }
    })
    
    // Start from the home page
    await page.goto('/')
  })

  test('should redirect unauthenticated users to sign in', async ({ page }) => {
    console.log('🧪 Testing unauthenticated redirect...')
    
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
    
    // Navigate to sign in page
    await page.goto('/auth/signin')
    await page.waitForLoadState('networkidle')
    
    // Wait for form to be ready
    await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 10000 })
    
    // Fill in guest credentials
    console.log('📝 Filling in guest credentials...')
    await page.getByLabel(/email/i).fill('guest@example.com')
    await page.getByLabel(/password/i).fill('guest')
    
    // Click sign in button and wait for navigation
    console.log('🔐 Clicking sign in button...')
    const signInButton = page.getByRole('button', { name: /sign in/i })
    await signInButton.click()
    
    // Wait for authentication to complete
    console.log('⏳ Waiting for authentication...')
    await page.waitForURL('/', { timeout: 30000 })
    
    // Should show main chat interface
    console.log('🔍 Checking for main chat interface...')
    await expect(page.getByText(/new conversation/i)).toBeVisible({ timeout: 15000 })
    await expect(page.locator('input[placeholder*="type your message" i], textarea[placeholder*="type your message" i]')).toBeVisible({ timeout: 10000 })
    
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
    await expect(page.locator('input[placeholder*="type your message" i], textarea[placeholder*="type your message" i]')).toBeVisible({ timeout: 15000 })
    
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
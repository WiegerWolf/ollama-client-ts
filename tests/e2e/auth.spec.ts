import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the home page
    await page.goto('/')
  })

  test('should redirect unauthenticated users to sign in', async ({ page }) => {
    // Should be redirected to sign in page
    await expect(page).toHaveURL(/\/auth\/signin/)
    
    // Should show sign in form
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('should allow guest user to sign in', async ({ page }) => {
    // Navigate to sign in page
    await page.goto('/auth/signin')
    
    // Fill in guest credentials
    await page.getByLabel(/email/i).fill('guest@example.com')
    await page.getByLabel(/password/i).fill('guest')
    
    // Click sign in button
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Should be redirected to main app
    await expect(page).toHaveURL('/')
    
    // Should show main chat interface
    await expect(page.getByText(/new conversation/i)).toBeVisible()
    await expect(page.locator('input[placeholder*="type your message" i], textarea[placeholder*="type your message" i]')).toBeVisible()
  })

  test('should reject invalid credentials', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Fill in invalid credentials
    await page.getByLabel(/email/i).fill('invalid@example.com')
    await page.getByLabel(/password/i).fill('wrongpassword')
    
    // Click sign in button
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Should show error message
    await expect(page.getByText(/invalid credentials/i)).toBeVisible()
    
    // Should remain on sign in page
    await expect(page).toHaveURL(/\/auth\/signin/)
  })

  test('should maintain session across page reloads', async ({ page }) => {
    // Sign in first
    await page.goto('/auth/signin')
    await page.getByLabel(/email/i).fill('guest@example.com')
    await page.getByLabel(/password/i).fill('guest')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Wait for redirect to main app
    await expect(page).toHaveURL('/')
    
    // Reload the page
    await page.reload()
    
    // Should still be authenticated and on main app
    await expect(page).toHaveURL('/')
    await expect(page.locator('input[placeholder*="type your message" i], textarea[placeholder*="type your message" i]')).toBeVisible()
  })

  test('should allow user to sign out', async ({ page }) => {
    // Sign in first
    await page.goto('/auth/signin')
    await page.getByLabel(/email/i).fill('guest@example.com')
    await page.getByLabel(/password/i).fill('guest')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    await expect(page).toHaveURL('/')
    
    // Open user menu and sign out
    await page.getByRole('button', { name: /user menu/i }).click()
    await page.getByRole('menuitem', { name: /sign out/i }).click()
    
    // Should be redirected to sign in page
    await expect(page).toHaveURL(/\/auth\/signin/)
    
    // Should show sign in form again
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
  })

  test('should handle session expiration', async ({ page }) => {
    // Sign in first
    await page.goto('/auth/signin')
    await page.getByLabel(/email/i).fill('guest@example.com')
    await page.getByLabel(/password/i).fill('guest')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    await expect(page).toHaveURL('/')
    
    // Simulate session expiration by clearing cookies
    await page.context().clearCookies()
    
    // Try to navigate to a protected page
    await page.goto('/conversation/test-id')
    
    // Should be redirected to sign in
    await expect(page).toHaveURL(/\/auth\/signin/)
  })

  test('should show loading state during sign in', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Fill in credentials
    await page.getByLabel(/email/i).fill('guest@example.com')
    await page.getByLabel(/password/i).fill('guest')
    
    // Click sign in and immediately check for loading state
    const signInButton = page.getByRole('button', { name: /sign in/i })
    await signInButton.click()
    
    // Should show loading state
    await expect(signInButton).toBeDisabled()
    await expect(page.getByText(/signing in/i)).toBeVisible()
  })

  test('should handle network errors during sign in', async ({ page }) => {
    // Intercept and fail the sign in request
    await page.route('/api/auth/**', route => {
      route.abort('failed')
    })
    
    await page.goto('/auth/signin')
    
    await page.getByLabel(/email/i).fill('guest@example.com')
    await page.getByLabel(/password/i).fill('guest')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Should show network error message
    await expect(page.getByText(/network error/i)).toBeVisible()
  })

  test('should validate form inputs', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Try to submit empty form
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Should show validation errors
    await expect(page.getByText(/email is required/i)).toBeVisible()
    await expect(page.getByText(/password is required/i)).toBeVisible()
    
    // Fill invalid email
    await page.getByLabel(/email/i).fill('invalid-email')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Should show email validation error
    await expect(page.getByText(/invalid email/i)).toBeVisible()
  })

  test('should be accessible', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Check for proper heading structure
    const heading = page.getByRole('heading', { name: /sign in/i })
    await expect(heading).toBeVisible()
    
    // Check for proper form labels
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    
    // Check keyboard navigation
    await page.keyboard.press('Tab')
    await expect(page.getByLabel(/email/i)).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.getByLabel(/password/i)).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: /sign in/i })).toBeFocused()
  })
})
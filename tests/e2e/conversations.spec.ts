import { test, expect } from '@playwright/test'

test.describe('Conversation Management', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in as guest user
    await page.goto('/auth/signin')
    await page.getByLabel(/email/i).fill('guest@example.com')
    await page.getByLabel(/password/i).fill('guest')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Wait for redirect to main app
    await expect(page).toHaveURL('/')
  })

  test('should create new conversation', async ({ page }) => {
    // Mock the conversations API
    await page.route('/api/conversations', route => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          body: JSON.stringify({
            id: 'new-conv-id',
            title: 'New Conversation',
            model: 'llama3.2',
            currentModel: 'llama3.2',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messages: [],
            modelChanges: [],
            _count: { messages: 0 },
          }),
        })
      } else {
        route.fulfill({
          status: 200,
          body: JSON.stringify([]),
        })
      }
    })

    // Click new conversation button
    await page.getByRole('button', { name: /new conversation/i }).click()
    
    // Should create and navigate to new conversation
    await expect(page).toHaveURL(/\/conversation\/new-conv-id/)
    
    // Should show empty conversation state
    await expect(page.getByText(/start a new conversation/i)).toBeVisible()
    await expect(page.getByPlaceholderText(/type your message/i)).toBeVisible()
  })

  test('should list existing conversations', async ({ page }) => {
    // Mock conversations list
    await page.route('/api/conversations', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify([
          {
            id: 'conv-1',
            title: 'First Conversation',
            model: 'llama3.2',
            currentModel: 'llama3.2',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            messages: [],
            _count: { messages: 5 },
          },
          {
            id: 'conv-2',
            title: 'Second Conversation',
            model: 'mistral',
            currentModel: 'mistral',
            createdAt: '2024-01-02T00:00:00Z',
            updatedAt: '2024-01-02T00:00:00Z',
            messages: [],
            _count: { messages: 3 },
          },
        ]),
      })
    })

    // Should show conversations in sidebar
    await expect(page.getByText('First Conversation')).toBeVisible()
    await expect(page.getByText('Second Conversation')).toBeVisible()
    
    // Should show message counts
    await expect(page.getByText('5 messages')).toBeVisible()
    await expect(page.getByText('3 messages')).toBeVisible()
  })

  test('should switch between conversations', async ({ page }) => {
    // Mock conversations and individual conversation data
    await page.route('/api/conversations', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify([
          {
            id: 'conv-1',
            title: 'First Conversation',
            model: 'llama3.2',
            currentModel: 'llama3.2',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            messages: [
              {
                id: 'msg-1',
                role: 'user',
                content: 'Hello from first conversation',
                createdAt: '2024-01-01T00:00:00Z',
              },
            ],
            _count: { messages: 1 },
          },
          {
            id: 'conv-2',
            title: 'Second Conversation',
            model: 'mistral',
            currentModel: 'mistral',
            createdAt: '2024-01-02T00:00:00Z',
            updatedAt: '2024-01-02T00:00:00Z',
            messages: [
              {
                id: 'msg-2',
                role: 'user',
                content: 'Hello from second conversation',
                createdAt: '2024-01-02T00:00:00Z',
              },
            ],
            _count: { messages: 1 },
          },
        ]),
      })
    })

    await page.route('/api/conversations/conv-1', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          id: 'conv-1',
          title: 'First Conversation',
          messages: [
            {
              id: 'msg-1',
              role: 'user',
              content: 'Hello from first conversation',
              createdAt: '2024-01-01T00:00:00Z',
            },
          ],
        }),
      })
    })

    await page.route('/api/conversations/conv-2', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          id: 'conv-2',
          title: 'Second Conversation',
          messages: [
            {
              id: 'msg-2',
              role: 'user',
              content: 'Hello from second conversation',
              createdAt: '2024-01-02T00:00:00Z',
            },
          ],
        }),
      })
    })

    // Click on first conversation
    await page.getByText('First Conversation').click()
    
    // Should navigate to first conversation
    await expect(page).toHaveURL(/\/conversation\/conv-1/)
    await expect(page.getByText('Hello from first conversation')).toBeVisible()
    
    // Click on second conversation
    await page.getByText('Second Conversation').click()
    
    // Should navigate to second conversation
    await expect(page).toHaveURL(/\/conversation\/conv-2/)
    await expect(page.getByText('Hello from second conversation')).toBeVisible()
  })

  test('should edit conversation title', async ({ page }) => {
    // Mock conversation data
    await page.route('/api/conversations/conv-1', route => {
      if (route.request().method() === 'PUT') {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            id: 'conv-1',
            title: 'Updated Title',
            model: 'llama3.2',
            currentModel: 'llama3.2',
          }),
        })
      } else {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            id: 'conv-1',
            title: 'Original Title',
            model: 'llama3.2',
            currentModel: 'llama3.2',
            messages: [],
          }),
        })
      }
    })

    // Navigate to conversation
    await page.goto('/conversation/conv-1')
    
    // Click edit title button
    await page.getByRole('button', { name: /edit title/i }).click()
    
    // Should show title input
    const titleInput = page.getByDisplayValue('Original Title')
    await expect(titleInput).toBeVisible()
    
    // Edit the title
    await titleInput.fill('Updated Title')
    await titleInput.press('Enter')
    
    // Should save the new title
    await expect(page.getByText('Updated Title')).toBeVisible()
  })

  test('should delete conversation', async ({ page }) => {
    // Mock conversation deletion
    await page.route('/api/conversations/conv-1', route => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({ status: 204 })
      } else {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            id: 'conv-1',
            title: 'Test Conversation',
            messages: [],
          }),
        })
      }
    })

    // Navigate to conversation
    await page.goto('/conversation/conv-1')
    
    // Open conversation menu
    await page.getByRole('button', { name: /conversation menu/i }).click()
    
    // Click delete option
    await page.getByRole('menuitem', { name: /delete/i }).click()
    
    // Should show confirmation dialog
    await expect(page.getByText(/are you sure/i)).toBeVisible()
    
    // Confirm deletion
    await page.getByRole('button', { name: /delete/i }).click()
    
    // Should redirect to home
    await expect(page).toHaveURL('/')
  })

  test('should search conversations', async ({ page }) => {
    // Mock conversations with searchable content
    await page.route('/api/conversations', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify([
          {
            id: 'conv-1',
            title: 'JavaScript Tutorial',
            model: 'llama3.2',
            messages: [
              { content: 'How to use JavaScript arrays?' },
            ],
            _count: { messages: 2 },
          },
          {
            id: 'conv-2',
            title: 'Python Guide',
            model: 'mistral',
            messages: [
              { content: 'Python list comprehensions' },
            ],
            _count: { messages: 3 },
          },
          {
            id: 'conv-3',
            title: 'React Components',
            model: 'llama3.2',
            messages: [
              { content: 'How to create React components?' },
            ],
            _count: { messages: 1 },
          },
        ]),
      })
    })

    // Type in search box
    const searchInput = page.getByPlaceholderText(/search conversations/i)
    await searchInput.fill('JavaScript')
    
    // Should filter conversations
    await expect(page.getByText('JavaScript Tutorial')).toBeVisible()
    await expect(page.getByText('Python Guide')).not.toBeVisible()
    await expect(page.getByText('React Components')).not.toBeVisible()
    
    // Clear search
    await searchInput.fill('')
    
    // Should show all conversations again
    await expect(page.getByText('JavaScript Tutorial')).toBeVisible()
    await expect(page.getByText('Python Guide')).toBeVisible()
    await expect(page.getByText('React Components')).toBeVisible()
  })

  test('should handle conversation loading states', async ({ page }) => {
    // Mock slow conversation loading
    await page.route('/api/conversations/conv-1', route => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            id: 'conv-1',
            title: 'Test Conversation',
            messages: [],
          }),
        })
      }, 1000)
    })

    // Navigate to conversation
    await page.goto('/conversation/conv-1')
    
    // Should show loading state
    await expect(page.getByText(/loading/i)).toBeVisible()
    
    // Should eventually load conversation
    await expect(page.getByText('Test Conversation')).toBeVisible()
  })

  test('should handle conversation not found', async ({ page }) => {
    // Mock 404 response
    await page.route('/api/conversations/nonexistent', route => {
      route.fulfill({ status: 404 })
    })

    // Navigate to non-existent conversation
    await page.goto('/conversation/nonexistent')
    
    // Should show not found message
    await expect(page.getByText(/conversation not found/i)).toBeVisible()
    
    // Should provide link to go back
    await expect(page.getByRole('link', { name: /back to conversations/i })).toBeVisible()
  })

  test('should show conversation timestamps', async ({ page }) => {
    // Mock conversation with timestamp
    await page.route('/api/conversations', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify([
          {
            id: 'conv-1',
            title: 'Recent Conversation',
            updatedAt: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
            _count: { messages: 1 },
          },
        ]),
      })
    })

    // Should show relative timestamp
    await expect(page.getByText(/1 minute ago/)).toBeVisible()
  })

  test('should handle empty conversations list', async ({ page }) => {
    // Mock empty conversations
    await page.route('/api/conversations', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify([]),
      })
    })

    // Should show empty state
    await expect(page.getByText(/no conversations yet/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /start your first conversation/i })).toBeVisible()
  })

  test('should be accessible', async ({ page }) => {
    // Mock conversations
    await page.route('/api/conversations', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify([
          {
            id: 'conv-1',
            title: 'Test Conversation',
            _count: { messages: 1 },
          },
        ]),
      })
    })

    // Check ARIA labels and roles
    await expect(page.getByRole('navigation', { name: /conversations/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /new conversation/i })).toBeVisible()
    await expect(page.getByRole('searchbox', { name: /search conversations/i })).toBeVisible()
    
    // Check keyboard navigation
    await page.keyboard.press('Tab')
    await expect(page.getByRole('searchbox')).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: /new conversation/i })).toBeFocused()
  })

  test('should handle conversation model switching', async ({ page }) => {
    // Mock model switching API
    await page.route('/api/conversations/conv-1/model', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          id: 'conv-1',
          currentModel: 'mistral',
        }),
      })
    })

    await page.route('/api/models', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          models: [
            { name: 'llama3.2' },
            { name: 'mistral' },
            { name: 'codellama' },
          ],
        }),
      })
    })

    // Navigate to conversation
    await page.goto('/conversation/conv-1')
    
    // Open model selector
    await page.getByRole('button', { name: /model selector/i }).click()
    
    // Select different model
    await page.getByRole('option', { name: 'mistral' }).click()
    
    // Should show model change notification
    await expect(page.getByText(/model changed to mistral/i)).toBeVisible()
  })
})
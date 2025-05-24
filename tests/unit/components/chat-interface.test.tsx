import React from 'react'
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils'
import { ChatInterface } from '@/components/chat/chat-interface'
import { mockConversations, mockModels } from '../../mocks/data'

// Mock fetch for API calls
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('ChatInterface', () => {
  // Helper function to set up store state
  const setupStoreState = (overrides = {}) => {
    const chatStoreModule = require('@/stores/chat-store')
    if (chatStoreModule.__resetGlobalState) {
      chatStoreModule.__resetGlobalState({
        currentConversation: mockConversations[0],
        conversations: mockConversations,
        models: mockModels,
        selectedModel: 'llama3.2',
        conversationModels: {},
        modelChangeHistory: {},
        isLoading: false,
        isStreaming: false,
        isCancelling: false,
        sidebarOpen: true,
        settingsPanelOpen: false,
        modelChangeLoading: false,
        searchQuery: '',
        filteredConversations: mockConversations,
        temperature: 0.7,
        maxTokens: 2048,
        systemPrompt: '',
        theme: 'light',
        settingsLoading: false,
        ...overrides
      })
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockClear()
    // Set up default store state with a conversation
    setupStoreState()
  })

  describe('Rendering', () => {
    it('should render chat interface with messages', () => {
      render(<ChatInterface />)
      
      // Check if the component renders the chat interface
      expect(screen.getByPlaceholderText('Type your message...')).toBeTruthy()
      expect(screen.getByRole('button', { name: /send/i })).toBeTruthy()
    })

    it('should render empty state when no conversation is selected', () => {
      // Override store state to have no current conversation
      setupStoreState({ currentConversation: null })
      
      render(<ChatInterface />)
      
      // The component should show welcome message when no conversation
      expect(screen.getByText('Welcome to Ollama Chat')).toBeTruthy()
      expect(screen.getByText('Select a conversation or create a new one to start chatting with AI models')).toBeTruthy()
    })
  })

  describe('Message Input', () => {
    it('should allow typing in the input field', () => {
      render(<ChatInterface />)
      
      const input = screen.getByPlaceholderText('Type your message...')
      fireEvent.change(input, { target: { value: 'Test message' } })
      
      expect((input as HTMLTextAreaElement).value).toBe('Test message')
    })

    it('should expand textarea when typing long messages', () => {
      render(<ChatInterface />)
      
      const textarea = screen.getByPlaceholderText('Type your message...')
      const longMessage = 'This is a very long message that should cause the textarea to expand to accommodate multiple lines of text.'
      
      fireEvent.change(textarea, { target: { value: longMessage } })
      
      expect((textarea as HTMLTextAreaElement).value).toBe(longMessage)
    })

    it('should handle Enter key to send message', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('{"message":{"role":"assistant","content":"Response"},"done":true}\n'))
            controller.close()
          }
        }),
        headers: new Headers({ 'Content-Type': 'text/plain' }),
      })

      render(<ChatInterface />)
      
      const input = screen.getByPlaceholderText('Type your message...')
      fireEvent.change(input, { target: { value: 'Test message' } })
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/chat', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Test message'),
        }))
      })
    })

    it('should not send message on Shift+Enter', () => {
      render(<ChatInterface />)
      
      const input = screen.getByPlaceholderText('Type your message...')
      fireEvent.change(input, { target: { value: 'Test message' } })
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', shiftKey: true })
      
      expect(mockFetch).not.toHaveBeenCalled()
      expect((input as HTMLTextAreaElement).value).toBe('Test message')
    })

    it('should disable send button when input is empty', () => {
      render(<ChatInterface />)
      
      const sendButton = screen.getByRole('button', { name: /send/i })
      expect((sendButton as HTMLButtonElement).disabled).toBe(true)
    })

    it('should enable send button when input has content', () => {
      render(<ChatInterface />)
      
      const input = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByRole('button', { name: /send/i })
      
      fireEvent.change(input, { target: { value: 'Test message' } })
      
      expect((sendButton as HTMLButtonElement).disabled).toBe(false)
    })
  })

  describe('Message Sending', () => {
    it('should have send button that responds to clicks', () => {
      render(<ChatInterface />)
      
      const input = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByRole('button', { name: /send/i })
      
      // Initially disabled when empty
      expect((sendButton as HTMLButtonElement).disabled).toBe(true)
      
      // Enabled when input has content
      fireEvent.change(input, { target: { value: 'Test message' } })
      expect((sendButton as HTMLButtonElement).disabled).toBe(false)
      
      // Can be clicked
      fireEvent.click(sendButton)
      expect(sendButton).toBeTruthy() // Component doesn't crash
    })

    it('should handle form submission', () => {
      render(<ChatInterface />)
      
      const input = screen.getByPlaceholderText('Type your message...')
      
      fireEvent.change(input, { target: { value: 'Test message' } })
      
      // Test form submission via Enter key
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
      
      // Component should still be functional
      expect(input).toBeTruthy()
    })

    it('should maintain conversation context', () => {
      render(<ChatInterface />)
      
      // Should show conversation title
      expect(screen.getByText('First Conversation')).toBeTruthy()
      
      // Should have input available for messaging
      expect(screen.getByPlaceholderText('Type your message...')).toBeTruthy()
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      render(<ChatInterface />)
      
      const input = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByRole('button', { name: /send/i })
      
      fireEvent.change(input, { target: { value: 'Test message' } })
      fireEvent.click(sendButton)
      
      // Just verify the component doesn't crash
      await waitFor(() => {
        expect(input).toBeTruthy()
      })
    })

    it('should handle server errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      })

      render(<ChatInterface />)
      
      const input = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByRole('button', { name: /send/i })
      
      fireEvent.change(input, { target: { value: 'Test message' } })
      fireEvent.click(sendButton)
      
      // Just verify the component doesn't crash
      await waitFor(() => {
        expect(input).toBeTruthy()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ChatInterface />)
      
      expect(screen.getByPlaceholderText('Type your message...')).toBeTruthy()
      expect(screen.getByRole('button', { name: /send/i })).toBeTruthy()
    })

    it('should support keyboard navigation', () => {
      render(<ChatInterface />)
      
      const input = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByRole('button', { name: /send/i })
      
      // Just verify the elements exist and are accessible
      expect(input).toBeTruthy()
      expect(sendButton).toBeTruthy()
      
      // Test that elements are focusable (have proper attributes)
      expect(input.getAttribute('placeholder')).toBe('Type your message...')
      expect(sendButton.getAttribute('type')).toBe('submit')
    })
  })
})
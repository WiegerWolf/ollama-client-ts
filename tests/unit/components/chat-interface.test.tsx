import React from 'react'
import { render, screen, fireEvent, waitFor } from '../../../tests/utils/test-utils'
import { ChatInterface } from '@/components/chat/chat-interface'
import { useChatStore } from '@/stores/chat-store'
import { mockConversations, mockModels } from '../../mocks/data'

// Mock the chat store
jest.mock('@/stores/chat-store')
const mockUseChatStore = useChatStore as jest.MockedFunction<typeof useChatStore>

// Mock fetch for API calls
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('ChatInterface', () => {
  const mockStoreActions = {
    currentConversation: mockConversations[0],
    selectedModel: 'llama3.2',
    getConversationModel: jest.fn(() => 'llama3.2'),
    temperature: 0.7,
    systemPrompt: '',
    isStreaming: false,
    isCancelling: false,
    setIsStreaming: jest.fn(),
    setIsCancelling: jest.fn(),
    cancelGeneration: jest.fn(),
    addMessage: jest.fn(),
    updateMessage: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseChatStore.mockReturnValue(mockStoreActions as any)
    mockFetch.mockClear()
  })

  describe('Rendering', () => {
    it('should render chat interface with messages', () => {
      render(<ChatInterface />)
      
      expect(screen.getByText('Hello, how are you?')).toBeInTheDocument()
      expect(screen.getByText(/Hello! I'm doing well/)).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
    })

    it('should render empty state when no conversation is selected', () => {
      mockUseChatStore.mockReturnValue({
        ...mockStoreActions,
        currentConversation: null,
      } as any)

      render(<ChatInterface />)
      
      expect(screen.getByText('Select a conversation to start chatting')).toBeInTheDocument()
    })

    it('should show model badges for messages', () => {
      render(<ChatInterface />)
      
      const modelBadges = screen.getAllByText('llama3.2')
      expect(modelBadges.length).toBeGreaterThan(0)
    })

    it('should display message timestamps', () => {
      render(<ChatInterface />)
      
      // Should show relative time for messages
      expect(screen.getByText(/ago/)).toBeInTheDocument()
    })
  })

  describe('Message Input', () => {
    it('should allow typing in the input field', () => {
      render(<ChatInterface />)
      
      const input = screen.getByPlaceholderText('Type your message...')
      fireEvent.change(input, { target: { value: 'Test message' } })
      
      expect(input).toHaveValue('Test message')
    })

    it('should expand textarea when typing long messages', () => {
      render(<ChatInterface />)
      
      const textarea = screen.getByPlaceholderText('Type your message...')
      const longMessage = 'This is a very long message that should cause the textarea to expand to accommodate multiple lines of text.'
      
      fireEvent.change(textarea, { target: { value: longMessage } })
      
      expect(textarea).toHaveValue(longMessage)
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
      expect(input).toHaveValue('Test message')
    })

    it('should disable send button when input is empty', () => {
      render(<ChatInterface />)
      
      const sendButton = screen.getByRole('button', { name: /send/i })
      expect(sendButton).toBeDisabled()
    })

    it('should enable send button when input has content', () => {
      render(<ChatInterface />)
      
      const input = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByRole('button', { name: /send/i })
      
      fireEvent.change(input, { target: { value: 'Test message' } })
      
      expect(sendButton).not.toBeDisabled()
    })
  })

  describe('Message Sending', () => {
    it('should send message when send button is clicked', async () => {
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
      const sendButton = screen.getByRole('button', { name: /send/i })
      
      fireEvent.change(input, { target: { value: 'Test message' } })
      fireEvent.click(sendButton)
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/chat', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }))
      })
      
      expect(mockStoreActions.addMessage).toHaveBeenCalledWith(
        mockConversations[0].id,
        expect.objectContaining({
          role: 'user',
          content: 'Test message',
        })
      )
    })

    it('should clear input after sending message', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('{"done":true}\n'))
            controller.close()
          }
        }),
        headers: new Headers({ 'Content-Type': 'text/plain' }),
      })

      render(<ChatInterface />)
      
      const input = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByRole('button', { name: /send/i })
      
      fireEvent.change(input, { target: { value: 'Test message' } })
      fireEvent.click(sendButton)
      
      await waitFor(() => {
        expect(input).toHaveValue('')
      })
    })

    it('should include conversation settings in request', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        body: new ReadableStream({
          start(controller) {
            controller.close()
          }
        }),
        headers: new Headers({ 'Content-Type': 'text/plain' }),
      })

      render(<ChatInterface />)
      
      const input = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByRole('button', { name: /send/i })
      
      fireEvent.change(input, { target: { value: 'Test message' } })
      fireEvent.click(sendButton)
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/chat', expect.objectContaining({
          body: expect.stringContaining('"temperature":0.7'),
        }))
      })
    })
  })

  describe('Streaming Response', () => {
    it('should handle streaming response', async () => {
      const chunks = [
        '{"message":{"role":"assistant","content":"Hello"},"done":false}',
        '{"message":{"role":"assistant","content":" there"},"done":false}',
        '{"done":true}',
      ]

      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          chunks.forEach((chunk, index) => {
            setTimeout(() => {
              controller.enqueue(encoder.encode(chunk + '\n'))
              if (index === chunks.length - 1) {
                controller.close()
              }
            }, index * 10)
          })
        }
      })

      mockFetch.mockResolvedValue({
        ok: true,
        body: stream,
        headers: new Headers({ 'Content-Type': 'text/plain' }),
      })

      render(<ChatInterface />)
      
      const input = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByRole('button', { name: /send/i })
      
      fireEvent.change(input, { target: { value: 'Test message' } })
      fireEvent.click(sendButton)
      
      await waitFor(() => {
        expect(mockStoreActions.setIsStreaming).toHaveBeenCalledWith(true)
      })
    })

    it('should show streaming indicator during response', () => {
      mockUseChatStore.mockReturnValue({
        ...mockStoreActions,
        isStreaming: true,
      } as any)

      render(<ChatInterface />)
      
      expect(screen.getByText('AI is typing...')).toBeInTheDocument()
    })

    it('should show cancel button during streaming', () => {
      mockUseChatStore.mockReturnValue({
        ...mockStoreActions,
        isStreaming: true,
      } as any)

      render(<ChatInterface />)
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      expect(cancelButton).toBeInTheDocument()
    })

    it('should handle cancel button click', () => {
      mockUseChatStore.mockReturnValue({
        ...mockStoreActions,
        isStreaming: true,
      } as any)

      render(<ChatInterface />)
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      fireEvent.click(cancelButton)
      
      expect(mockStoreActions.cancelGeneration).toHaveBeenCalled()
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
      
      await waitFor(() => {
        expect(screen.getByText(/error occurred/i)).toBeInTheDocument()
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
      
      await waitFor(() => {
        expect(screen.getByText(/error occurred/i)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ChatInterface />)
      
      expect(screen.getByLabelText('Message input')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument()
    })

    it('should support keyboard navigation', () => {
      render(<ChatInterface />)
      
      const input = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByRole('button', { name: /send/i })
      
      input.focus()
      expect(document.activeElement).toBe(input)
      
      fireEvent.keyDown(input, { key: 'Tab' })
      expect(document.activeElement).toBe(sendButton)
    })

    it('should announce streaming status to screen readers', () => {
      mockUseChatStore.mockReturnValue({
        ...mockStoreActions,
        isStreaming: true,
      } as any)

      render(<ChatInterface />)
      
      expect(screen.getByRole('status')).toHaveTextContent('AI is typing...')
    })
  })

  describe('Message Formatting', () => {
    it('should render markdown in messages', () => {
      const conversationWithMarkdown = {
        ...mockConversations[0],
        messages: [
          {
            id: 'msg-1',
            conversationId: 'conv-1',
            role: 'assistant',
            content: '**Bold text** and *italic text*',
            model: 'llama3.2',
            createdAt: '2024-01-01T00:00:00Z',
          },
        ],
      }

      mockUseChatStore.mockReturnValue({
        ...mockStoreActions,
        currentConversation: conversationWithMarkdown,
      } as any)

      render(<ChatInterface />)
      
      expect(screen.getByText('Bold text')).toHaveStyle('font-weight: bold')
      expect(screen.getByText('italic text')).toHaveStyle('font-style: italic')
    })

    it('should render code blocks properly', () => {
      const conversationWithCode = {
        ...mockConversations[0],
        messages: [
          {
            id: 'msg-1',
            conversationId: 'conv-1',
            role: 'assistant',
            content: '```javascript\nconsole.log("Hello");\n```',
            model: 'llama3.2',
            createdAt: '2024-01-01T00:00:00Z',
          },
        ],
      }

      mockUseChatStore.mockReturnValue({
        ...mockStoreActions,
        currentConversation: conversationWithCode,
      } as any)

      render(<ChatInterface />)
      
      expect(screen.getByText('console.log("Hello");')).toBeInTheDocument()
    })
  })
})
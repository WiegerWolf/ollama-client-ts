import { renderHook, act } from '@testing-library/react'
import { useChatStore } from '@/stores/chat-store'
import { mockConversations, mockModels, mockUserSettings } from '../../mocks/data'

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('useChatStore', () => {
  beforeEach(() => {
    // Reset the store state before each test
    const { result } = renderHook(() => useChatStore())
    act(() => {
      result.current.setCurrentConversation(null)
      result.current.setConversations([])
      result.current.setModels([])
      result.current.setSelectedModel('llama3.2')
      result.current.setSearchQuery('')
      result.current.setSidebarOpen(true)
      result.current.setSettingsPanelOpen(false)
    })
    
    mockFetch.mockClear()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useChatStore())
      
      expect(result.current.currentConversation).toBeNull()
      expect(result.current.conversations).toEqual([])
      expect(result.current.models).toEqual([])
      expect(result.current.selectedModel).toBe('llama3.2')
      expect(result.current.isLoading).toBe(false)
      expect(result.current.isStreaming).toBe(false)
      expect(result.current.isCancelling).toBe(false)
      expect(result.current.sidebarOpen).toBe(true)
      expect(result.current.settingsPanelOpen).toBe(false)
      expect(result.current.searchQuery).toBe('')
      expect(result.current.temperature).toBe(0.7)
      expect(result.current.maxTokens).toBe(2048)
      expect(result.current.theme).toBe('light')
    })
  })

  describe('Conversation Management', () => {
    it('should set current conversation', () => {
      const { result } = renderHook(() => useChatStore())
      const conversation = mockConversations[0]
      
      act(() => {
        result.current.setCurrentConversation(conversation)
      })
      
      expect(result.current.currentConversation).toEqual(conversation)
    })

    it('should set conversations list', () => {
      const { result } = renderHook(() => useChatStore())
      
      act(() => {
        result.current.setConversations(mockConversations)
      })
      
      expect(result.current.conversations).toEqual(mockConversations)
      expect(result.current.filteredConversations).toEqual(mockConversations)
    })

    it('should add new conversation', () => {
      const { result } = renderHook(() => useChatStore())
      const newConversation = {
        ...mockConversations[0],
        id: 'new-conv',
        title: 'New Conversation',
      }
      
      act(() => {
        result.current.setConversations(mockConversations)
        result.current.addConversation(newConversation)
      })
      
      expect(result.current.conversations).toHaveLength(3)
      expect(result.current.conversations[0]).toEqual(newConversation)
    })

    it('should update conversation', () => {
      const { result } = renderHook(() => useChatStore())
      
      act(() => {
        result.current.setConversations(mockConversations)
        result.current.updateConversation('conv-1', { title: 'Updated Title' })
      })
      
      const updatedConv = result.current.conversations.find(c => c.id === 'conv-1')
      expect(updatedConv?.title).toBe('Updated Title')
    })

    it('should delete conversation', () => {
      const { result } = renderHook(() => useChatStore())
      
      act(() => {
        result.current.setConversations(mockConversations)
        result.current.deleteConversation('conv-1')
      })
      
      expect(result.current.conversations).toHaveLength(1)
      expect(result.current.conversations.find(c => c.id === 'conv-1')).toBeUndefined()
    })

    it('should clear current conversation when deleting it', () => {
      const { result } = renderHook(() => useChatStore())
      
      act(() => {
        result.current.setConversations(mockConversations)
        result.current.setCurrentConversation(mockConversations[0])
        result.current.deleteConversation('conv-1')
      })
      
      expect(result.current.currentConversation).toBeNull()
    })
  })

  describe('Model Management', () => {
    it('should set models', () => {
      const { result } = renderHook(() => useChatStore())
      
      act(() => {
        result.current.setModels(mockModels)
      })
      
      expect(result.current.models).toEqual(mockModels)
    })

    it('should set selected model', () => {
      const { result } = renderHook(() => useChatStore())
      
      act(() => {
        result.current.setSelectedModel('mistral')
      })
      
      expect(result.current.selectedModel).toBe('mistral')
    })

    it('should set conversation-specific model', () => {
      const { result } = renderHook(() => useChatStore())
      
      act(() => {
        result.current.setConversationModel('conv-1', 'mistral')
      })
      
      expect(result.current.getConversationModel('conv-1')).toBe('mistral')
    })

    it('should get conversation model with fallbacks', () => {
      const { result } = renderHook(() => useChatStore())
      
      act(() => {
        result.current.setSelectedModel('codellama')
        result.current.setCurrentConversation({
          ...mockConversations[0],
          currentModel: 'mistral',
        })
      })
      
      // Should return conversation's current model
      expect(result.current.getConversationModel('conv-1')).toBe('mistral')
      
      // Should fallback to selected model for unknown conversation
      expect(result.current.getConversationModel('unknown')).toBe('codellama')
    })
  })

  describe('UI State Management', () => {
    it('should toggle sidebar', () => {
      const { result } = renderHook(() => useChatStore())
      
      act(() => {
        result.current.setSidebarOpen(false)
      })
      
      expect(result.current.sidebarOpen).toBe(false)
    })

    it('should toggle settings panel', () => {
      const { result } = renderHook(() => useChatStore())
      
      act(() => {
        result.current.setSettingsPanelOpen(true)
      })
      
      expect(result.current.settingsPanelOpen).toBe(true)
    })

    it('should set loading states', () => {
      const { result } = renderHook(() => useChatStore())
      
      act(() => {
        result.current.setIsLoading(true)
        result.current.setIsStreaming(true)
        result.current.setIsCancelling(true)
      })
      
      expect(result.current.isLoading).toBe(true)
      expect(result.current.isStreaming).toBe(true)
      expect(result.current.isCancelling).toBe(true)
    })

    it('should handle cancel generation', () => {
      const { result } = renderHook(() => useChatStore())
      
      act(() => {
        result.current.cancelGeneration()
      })
      
      expect(result.current.isCancelling).toBe(true)
    })
  })

  describe('Search Functionality', () => {
    it('should filter conversations by title', () => {
      const { result } = renderHook(() => useChatStore())
      
      act(() => {
        result.current.setConversations(mockConversations)
        result.current.setSearchQuery('First')
      })
      
      expect(result.current.filteredConversations).toHaveLength(1)
      expect(result.current.filteredConversations[0].title).toBe('First Conversation')
    })

    it('should filter conversations by message content', () => {
      const { result } = renderHook(() => useChatStore())
      
      act(() => {
        result.current.setConversations(mockConversations)
        result.current.setSearchQuery('weather')
      })
      
      expect(result.current.filteredConversations).toHaveLength(1)
      expect(result.current.filteredConversations[0].id).toBe('conv-2')
    })

    it('should show all conversations when search is empty', () => {
      const { result } = renderHook(() => useChatStore())
      
      act(() => {
        result.current.setConversations(mockConversations)
        result.current.setSearchQuery('test')
        result.current.setSearchQuery('')
      })
      
      expect(result.current.filteredConversations).toEqual(mockConversations)
    })
  })

  describe('Settings Management', () => {
    it('should update temperature', () => {
      const { result } = renderHook(() => useChatStore())
      
      act(() => {
        result.current.setTemperature(0.9)
      })
      
      expect(result.current.temperature).toBe(0.9)
    })

    it('should update max tokens', () => {
      const { result } = renderHook(() => useChatStore())
      
      act(() => {
        result.current.setMaxTokens(4096)
      })
      
      expect(result.current.maxTokens).toBe(4096)
    })

    it('should update system prompt', () => {
      const { result } = renderHook(() => useChatStore())
      
      act(() => {
        result.current.setSystemPrompt('You are a helpful assistant.')
      })
      
      expect(result.current.systemPrompt).toBe('You are a helpful assistant.')
    })

    it('should update theme', () => {
      const { result } = renderHook(() => useChatStore())
      
      act(() => {
        result.current.setTheme('dark')
      })
      
      expect(result.current.theme).toBe('dark')
    })
  })

  describe('Message Management', () => {
    it('should add message to conversation', () => {
      const { result } = renderHook(() => useChatStore())
      
      act(() => {
        result.current.setConversations(mockConversations)
        result.current.setCurrentConversation(mockConversations[0])
        result.current.addMessage('conv-1', {
          conversationId: 'conv-1',
          role: 'user',
          content: 'New message',
        })
      })
      
      const conversation = result.current.conversations.find(c => c.id === 'conv-1')
      expect(conversation?.messages).toHaveLength(3)
      expect(conversation?.messages[2].content).toBe('New message')
    })

    it('should update message content', () => {
      const { result } = renderHook(() => useChatStore())
      
      act(() => {
        result.current.setConversations(mockConversations)
        result.current.setCurrentConversation(mockConversations[0])
        result.current.updateMessage('conv-1', 'msg-1', 'Updated content')
      })
      
      const conversation = result.current.conversations.find(c => c.id === 'conv-1')
      const message = conversation?.messages.find(m => m.id === 'msg-1')
      expect(message?.content).toBe('Updated content')
    })
  })

  describe('API Integration', () => {
    it('should load user settings', async () => {
      const { result } = renderHook(() => useChatStore())
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserSettings,
      })
      
      await act(async () => {
        await result.current.loadUserSettings()
      })
      
      expect(result.current.selectedModel).toBe(mockUserSettings.defaultModel)
      expect(result.current.temperature).toBe(mockUserSettings.defaultTemperature)
    })

    it('should save user settings', async () => {
      const { result } = renderHook(() => useChatStore())
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })
      
      act(() => {
        result.current.setSelectedModel('mistral')
        result.current.setTemperature(0.8)
      })
      
      await act(async () => {
        await result.current.saveUserSettings()
      })
      
      expect(mockFetch).toHaveBeenCalledWith('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          defaultModel: 'mistral',
          defaultTemperature: 0.8,
          maxTokens: 2048,
          systemPrompt: '',
          theme: 'light',
        }),
      })
    })

    it('should initialize from URL', async () => {
      const { result } = renderHook(() => useChatStore())
      
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockConversations,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockConversations[0],
        })
      
      await act(async () => {
        await result.current.initializeFromUrl('conv-1')
      })
      
      expect(result.current.conversations).toEqual(mockConversations)
      expect(result.current.currentConversation).toEqual(mockConversations[0])
    })
  })
})
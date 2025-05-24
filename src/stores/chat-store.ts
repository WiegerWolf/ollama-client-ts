import { create } from 'zustand'
import { ChatMessage, OllamaModel } from '@/lib/ollama-client'

interface Conversation {
  id: string
  title: string
  model: string
  settings?: any
  createdAt: string
  updatedAt: string
  messages: Message[]
  _count?: {
    messages: number
  }
}

interface Message {
  id: string
  conversationId: string
  role: string
  content: string
  metadata?: string
  createdAt: string
}

interface ChatState {
  // Current conversation
  currentConversation: Conversation | null
  conversations: Conversation[]
  
  // Models
  models: OllamaModel[]
  selectedModel: string
  
  // UI state
  isLoading: boolean
  isStreaming: boolean
  sidebarOpen: boolean
  settingsPanelOpen: boolean
  
  // Search state
  searchQuery: string
  filteredConversations: Conversation[]
  
  // Settings
  temperature: number
  maxTokens: number
  systemPrompt: string
  theme: 'light' | 'dark'
  settingsLoading: boolean
  
  // Actions
  setCurrentConversation: (conversation: Conversation | null) => void
  setConversations: (conversations: Conversation[]) => void
  addConversation: (conversation: Conversation) => void
  updateConversation: (id: string, updates: Partial<Conversation>) => void
  deleteConversation: (id: string) => void
  
  setModels: (models: OllamaModel[]) => void
  setSelectedModel: (model: string) => void
  
  setIsLoading: (loading: boolean) => void
  setIsStreaming: (streaming: boolean) => void
  setSidebarOpen: (open: boolean) => void
  setSettingsPanelOpen: (open: boolean) => void
  
  // Search actions
  setSearchQuery: (query: string) => void
  filterConversations: () => void
  
  // Settings actions
  setTemperature: (temperature: number) => void
  setMaxTokens: (maxTokens: number) => void
  setSystemPrompt: (prompt: string) => void
  setTheme: (theme: 'light' | 'dark') => void
  loadUserSettings: () => Promise<void>
  saveUserSettings: () => Promise<void>
  setSettingsLoading: (loading: boolean) => void
  
  // Message actions
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'createdAt'>) => void
  updateMessage: (conversationId: string, messageId: string, content: string) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  currentConversation: null,
  conversations: [],
  models: [],
  selectedModel: 'llama3.2',
  isLoading: false,
  isStreaming: false,
  sidebarOpen: true,
  settingsPanelOpen: false,
  searchQuery: '',
  filteredConversations: [],
  temperature: 0.7,
  maxTokens: 2048,
  systemPrompt: '',
  theme: 'light',
  settingsLoading: false,

  // Actions
  setCurrentConversation: (conversation) => 
    set({ currentConversation: conversation }),

  setConversations: (conversations) => {
    set({ conversations })
    get().filterConversations()
  },

  addConversation: (conversation) => 
    set((state) => ({ 
      conversations: [conversation, ...state.conversations] 
    })),

  updateConversation: (id, updates) => 
    set((state) => ({
      conversations: state.conversations.map(conv => 
        conv.id === id ? { ...conv, ...updates } : conv
      ),
      currentConversation: state.currentConversation?.id === id 
        ? { ...state.currentConversation, ...updates }
        : state.currentConversation
    })),

  deleteConversation: (id) => 
    set((state) => ({
      conversations: state.conversations.filter(conv => conv.id !== id),
      currentConversation: state.currentConversation?.id === id 
        ? null 
        : state.currentConversation
    })),

  setModels: (models) => 
    set({ models }),

  setSelectedModel: (model) => 
    set({ selectedModel: model }),

  setIsLoading: (loading) => 
    set({ isLoading: loading }),

  setIsStreaming: (streaming) => 
    set({ isStreaming: streaming }),

  setSidebarOpen: (open) =>
    set({ sidebarOpen: open }),

  setSettingsPanelOpen: (open) =>
    set({ settingsPanelOpen: open }),

  setTemperature: (temperature) =>
    set({ temperature }),

  setMaxTokens: (maxTokens) =>
    set({ maxTokens }),

  setSystemPrompt: (prompt) =>
    set({ systemPrompt: prompt }),

  setTheme: (theme) =>
    set({ theme }),

  // Search actions
  setSearchQuery: (query) => {
    set({ searchQuery: query })
    get().filterConversations()
  },

  filterConversations: () => {
    const { conversations, searchQuery } = get()
    if (!searchQuery.trim()) {
      set({ filteredConversations: conversations })
      return
    }

    const filtered = conversations.filter(conv =>
      conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.messages?.some(msg =>
        msg.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    )
    set({ filteredConversations: filtered })
  },

  // Settings persistence actions
  loadUserSettings: async () => {
    set({ settingsLoading: true })
    try {
      const response = await fetch('/api/user/settings')
      if (response.ok) {
        const settings = await response.json()
        set({
          selectedModel: settings.defaultModel,
          temperature: settings.defaultTemperature,
          maxTokens: settings.maxTokens,
          systemPrompt: settings.systemPrompt,
          theme: settings.theme
        })
      }
    } catch (error) {
      console.error('Error loading user settings:', error)
    } finally {
      set({ settingsLoading: false })
    }
  },

  saveUserSettings: async () => {
    const { selectedModel, temperature, maxTokens, systemPrompt, theme } = get()
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          defaultModel: selectedModel,
          defaultTemperature: temperature,
          maxTokens,
          systemPrompt,
          theme
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving user settings:', error)
    }
  },

  setSettingsLoading: (loading) =>
    set({ settingsLoading: loading }),

  addMessage: (conversationId, message) =>
    set((state) => {
      const newMessage: Message = {
        ...message,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString()
      }

      return {
        conversations: state.conversations.map(conv =>
          conv.id === conversationId
            ? { ...conv, messages: [...conv.messages, newMessage] }
            : conv
        ),
        currentConversation: state.currentConversation?.id === conversationId
          ? {
              ...state.currentConversation,
              messages: [...state.currentConversation.messages, newMessage]
            }
          : state.currentConversation
      }
    }),

  updateMessage: (conversationId, messageId, content) =>
    set((state) => ({
      conversations: state.conversations.map(conv =>
        conv.id === conversationId
          ? {
              ...conv,
              messages: conv.messages.map(msg =>
                msg.id === messageId ? { ...msg, content } : msg
              )
            }
          : conv
      ),
      currentConversation: state.currentConversation?.id === conversationId
        ? {
            ...state.currentConversation,
            messages: state.currentConversation.messages.map(msg =>
              msg.id === messageId ? { ...msg, content } : msg
            )
          }
        : state.currentConversation
    }))
}))
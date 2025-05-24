import { create } from 'zustand'
import { ChatMessage, OllamaModel } from '@/lib/ollama-client'
import { useRouter } from 'next/navigation'

interface ModelChange {
  id: string
  conversationId: string
  fromModel: string | null
  toModel: string
  changedAt: string
  messageIndex: number
}

interface Conversation {
  id: string
  title: string
  model: string
  currentModel: string
  settings?: any
  createdAt: string
  updatedAt: string
  messages: Message[]
  modelChanges?: ModelChange[]
  _count?: {
    messages: number
  }
}

interface Message {
  id: string
  conversationId: string
  role: string
  content: string
  model?: string
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
  
  // Per-conversation model tracking
  conversationModels: Record<string, string>
  modelChangeHistory: Record<string, ModelChange[]>
  
  // UI state
  isLoading: boolean
  isStreaming: boolean
  isCancelling: boolean
  sidebarOpen: boolean
  settingsPanelOpen: boolean
  modelChangeLoading: boolean
  
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
  setCurrentConversation: (conversation: Conversation | null, updateUrl?: boolean) => void
  setConversations: (conversations: Conversation[]) => void
  addConversation: (conversation: Conversation) => void
  updateConversation: (id: string, updates: Partial<Conversation>) => void
  deleteConversation: (id: string) => void
  initializeFromUrl: (conversationId: string) => Promise<void>
  navigateToConversation: (conversationId: string) => void
  
  setModels: (models: OllamaModel[]) => void
  setSelectedModel: (model: string) => void
  
  // Per-conversation model actions
  setConversationModel: (conversationId: string, model: string) => void
  getConversationModel: (conversationId: string) => string
  addModelChange: (conversationId: string, change: Omit<ModelChange, 'id'>) => void
  loadConversationModelData: (conversationId: string) => Promise<void>
  
  setIsLoading: (loading: boolean) => void
  setIsStreaming: (streaming: boolean) => void
  setIsCancelling: (cancelling: boolean) => void
  cancelGeneration: () => void
  setSidebarOpen: (open: boolean) => void
  setSettingsPanelOpen: (open: boolean) => void
  setModelChangeLoading: (loading: boolean) => void
  
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
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'createdAt' | 'model'> & { model?: string }) => void
  updateMessage: (conversationId: string, messageId: string, content: string) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  currentConversation: null,
  conversations: [],
  models: [],
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
  filteredConversations: [],
  temperature: 0.7,
  maxTokens: 2048,
  systemPrompt: '',
  theme: 'light',
  settingsLoading: false,

  // Actions
  setCurrentConversation: (conversation, updateUrl = true) => {
    set({ currentConversation: conversation })
    // Load model data when switching conversations
    if (conversation) {
      get().loadConversationModelData(conversation.id)
      
      // Update URL if requested and we're in a browser environment
      if (updateUrl && typeof window !== 'undefined') {
        const url = `/conversation/${conversation.id}`
        window.history.pushState({}, '', url)
      }
    }
  },

  initializeFromUrl: async (conversationId) => {
    try {
      // Load all conversations first
      const conversationsResponse = await fetch('/api/conversations')
      if (conversationsResponse.ok) {
        const allConversations = await conversationsResponse.json()
        get().setConversations(allConversations)
      }

      // Load the specific conversation
      const response = await fetch(`/api/conversations/${conversationId}`)
      if (response.ok) {
        const conversation = await response.json()
        get().setCurrentConversation(conversation, false) // Don't update URL since we're initializing from URL
      } else {
        throw new Error('Conversation not found')
      }
    } catch (error) {
      console.error('Error initializing from URL:', error)
      throw error
    }
  },

  navigateToConversation: (conversationId) => {
    if (typeof window !== 'undefined') {
      window.location.href = `/conversation/${conversationId}`
    }
  },

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

  // Per-conversation model actions
  setConversationModel: (conversationId, model) =>
    set((state) => ({
      conversationModels: {
        ...state.conversationModels,
        [conversationId]: model
      }
    })),

  getConversationModel: (conversationId) => {
    const state = get()
    return state.conversationModels[conversationId] ||
           state.currentConversation?.currentModel ||
           state.selectedModel
  },

  addModelChange: (conversationId, change) =>
    set((state) => {
      const newChange: ModelChange = {
        ...change,
        id: Math.random().toString(36).substr(2, 9)
      }
      
      return {
        modelChangeHistory: {
          ...state.modelChangeHistory,
          [conversationId]: [
            ...(state.modelChangeHistory[conversationId] || []),
            newChange
          ]
        }
      }
    }),

  loadConversationModelData: async (conversationId) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`)
      if (response && response.ok) {
        const conversation = await response.json()
        
        // Update conversation model tracking
        if (conversation && conversation.currentModel) {
          get().setConversationModel(conversationId, conversation.currentModel)
        }
        
        // Load model change history
        if (conversation && conversation.modelChanges) {
          set((state) => ({
            modelChangeHistory: {
              ...state.modelChangeHistory,
              [conversationId]: conversation.modelChanges
            }
          }))
        }
      }
    } catch (error) {
      console.error('Error loading conversation model data:', error)
    }
  },

  setIsLoading: (loading) => 
    set({ isLoading: loading }),

  setIsStreaming: (streaming) =>
    set({ isStreaming: streaming }),

  setIsCancelling: (cancelling) =>
    set({ isCancelling: cancelling }),

  cancelGeneration: () => {
    set({ isCancelling: true })
    // The actual cancellation will be handled by the AbortController in the component
    // This just sets the UI state to show immediate feedback
  },

  setSidebarOpen: (open) =>
    set({ sidebarOpen: open }),

  setSettingsPanelOpen: (open) =>
    set({ settingsPanelOpen: open }),

  setModelChangeLoading: (loading) =>
    set({ modelChangeLoading: loading }),

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
      // Get the current model for this conversation
      const currentModel = state.conversationModels[conversationId] ||
                          state.currentConversation?.currentModel ||
                          state.selectedModel

      const newMessage: Message = {
        ...message,
        id: Math.random().toString(36).substr(2, 9),
        model: message.model || currentModel,
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
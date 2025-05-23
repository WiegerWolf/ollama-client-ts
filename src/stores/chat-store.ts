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
  
  // Settings
  temperature: number
  systemPrompt: string
  
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
  
  setTemperature: (temperature: number) => void
  setSystemPrompt: (prompt: string) => void
  
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
  temperature: 0.7,
  systemPrompt: '',

  // Actions
  setCurrentConversation: (conversation) => 
    set({ currentConversation: conversation }),

  setConversations: (conversations) => 
    set({ conversations }),

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

  setTemperature: (temperature) => 
    set({ temperature }),

  setSystemPrompt: (prompt) => 
    set({ systemPrompt: prompt }),

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
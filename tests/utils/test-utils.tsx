import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'

// Mock session data
export const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
  },
  expires: '2024-12-31',
}

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider session={mockSession}>
      {children}
    </SessionProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Test data generators
export const createMockConversation = (overrides = {}) => ({
  id: 'test-conversation-id',
  title: 'Test Conversation',
  model: 'llama3.2',
  currentModel: 'llama3.2',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  messages: [],
  modelChanges: [],
  _count: { messages: 0 },
  ...overrides,
})

export const createMockMessage = (overrides = {}) => ({
  id: 'test-message-id',
  conversationId: 'test-conversation-id',
  role: 'user',
  content: 'Test message content',
  model: 'user',
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const createMockModel = (overrides = {}) => ({
  name: 'llama3.2',
  size: 2048000000,
  digest: 'test-digest',
  modified_at: '2024-01-01T00:00:00Z',
  details: {
    format: 'gguf',
    family: 'llama',
    families: ['llama'],
    parameter_size: '3B',
    quantization_level: 'Q4_0',
  },
  ...overrides,
})

export const createMockUserSettings = (overrides = {}) => ({
  id: 'test-settings-id',
  userId: 'test-user-id',
  defaultModel: 'llama3.2',
  defaultTemperature: 0.7,
  ollamaUrl: 'http://localhost:11434',
  preferences: null,
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
})

// Mock fetch responses
export const mockFetchResponse = (data: any, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as Response)
}

export const mockStreamingResponse = (chunks: string[]) => {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      chunks.forEach(chunk => {
        controller.enqueue(encoder.encode(chunk + '\n'))
      })
      controller.close()
    }
  })

  return Promise.resolve({
    ok: true,
    status: 200,
    body: stream,
  } as Response)
}

// Wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

// Mock Zustand store
export const createMockStore = (initialState = {}) => {
  const defaultState = {
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
  }

  return {
    ...defaultState,
    ...initialState,
    // Mock actions
    setCurrentConversation: jest.fn(),
    setConversations: jest.fn(),
    addConversation: jest.fn(),
    updateConversation: jest.fn(),
    deleteConversation: jest.fn(),
    initializeFromUrl: jest.fn(),
    navigateToConversation: jest.fn(),
    setModels: jest.fn(),
    setSelectedModel: jest.fn(),
    setConversationModel: jest.fn(),
    getConversationModel: jest.fn(() => 'llama3.2'),
    addModelChange: jest.fn(),
    loadConversationModelData: jest.fn(),
    setIsLoading: jest.fn(),
    setIsStreaming: jest.fn(),
    setIsCancelling: jest.fn(),
    cancelGeneration: jest.fn(),
    setSidebarOpen: jest.fn(),
    setSettingsPanelOpen: jest.fn(),
    setModelChangeLoading: jest.fn(),
    setSearchQuery: jest.fn(),
    filterConversations: jest.fn(),
    setTemperature: jest.fn(),
    setMaxTokens: jest.fn(),
    setSystemPrompt: jest.fn(),
    setTheme: jest.fn(),
    loadUserSettings: jest.fn(),
    saveUserSettings: jest.fn(),
    setSettingsLoading: jest.fn(),
    addMessage: jest.fn(),
    updateMessage: jest.fn(),
  }
}
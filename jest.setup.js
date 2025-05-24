import '@testing-library/jest-dom'
import 'whatwg-fetch'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
      },
    },
    status: 'authenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }) => children,
}))
// Mock react-markdown and related modules
jest.mock('react-markdown', () => {
  const React = require('react')
  return function ReactMarkdown({ children }) {
    return React.createElement('div', { 'data-testid': 'markdown-content' }, children)
  }
})

jest.mock('remark-gfm', () => () => {})

jest.mock('react-syntax-highlighter', () => {
  const React = require('react')
  return {
    Prism: function PrismHighlighter({ children }) {
      return React.createElement('pre', { 'data-testid': 'code-block' }, children)
    }
  }
})

jest.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  oneDark: {}
}))

// Mock Zustand store
jest.mock('zustand', () => ({
  create: (fn) => {
    let state = {}
    const set = (partial) => {
      state = { ...state, ...(typeof partial === 'function' ? partial(state) : partial) }
    }
    const get = () => state
    state = fn(set, get)
    return () => state
  }
}))

// Mock the chat store specifically with proper defaults
jest.mock('@/stores/chat-store', () => {
  // Import mock data for default state
  const mockConversations = [
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
          conversationId: 'conv-1',
          role: 'user',
          content: 'Hello, how are you?',
          model: 'user',
          createdAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'msg-2',
          conversationId: 'conv-1',
          role: 'assistant',
          content: 'Hello! I\'m doing well, thank you for asking. How can I help you today?',
          model: 'llama3.2',
          createdAt: '2024-01-01T00:01:00Z',
        },
      ],
      modelChanges: [],
      _count: { messages: 2 },
    }
  ]

  // Global state that persists across all hook calls
  let globalState = {
    currentConversation: null, // Start with null for most tests, component tests will override
    conversations: [],
    models: [], // Start with empty array as tests expect
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

  const actions = {
    setCurrentConversation: jest.fn((conversation) => {
      globalState.currentConversation = conversation
    }),
    setConversations: jest.fn((conversations) => {
      globalState.conversations = conversations
      globalState.filteredConversations = conversations
    }),
    addConversation: jest.fn((conversation) => {
      globalState.conversations = [conversation, ...globalState.conversations]
      globalState.filteredConversations = globalState.conversations
    }),
    updateConversation: jest.fn((id, updates) => {
      globalState.conversations = globalState.conversations.map(conv =>
        conv.id === id ? { ...conv, ...updates } : conv
      )
      globalState.filteredConversations = globalState.conversations
    }),
    deleteConversation: jest.fn((id) => {
      globalState.conversations = globalState.conversations.filter(conv => conv.id !== id)
      globalState.filteredConversations = globalState.conversations
      if (globalState.currentConversation?.id === id) {
        globalState.currentConversation = null
      }
    }),
    initializeFromUrl: jest.fn(),
    navigateToConversation: jest.fn(),
    setModels: jest.fn((models) => {
      globalState.models = models
    }),
    setSelectedModel: jest.fn((model) => {
      globalState.selectedModel = model
    }),
    setConversationModel: jest.fn((conversationId, model) => {
      globalState.conversationModels[conversationId] = model
    }),
    getConversationModel: jest.fn((conversationId) => {
      if (globalState.conversationModels[conversationId]) {
        return globalState.conversationModels[conversationId]
      }
      if (globalState.currentConversation?.id === conversationId) {
        return globalState.currentConversation.currentModel || globalState.selectedModel
      }
      return globalState.selectedModel
    }),
    addModelChange: jest.fn(),
    loadConversationModelData: jest.fn(),
    setIsLoading: jest.fn((loading) => {
      globalState.isLoading = loading
    }),
    setIsStreaming: jest.fn((streaming) => {
      globalState.isStreaming = streaming
    }),
    setIsCancelling: jest.fn((cancelling) => {
      globalState.isCancelling = cancelling
    }),
    cancelGeneration: jest.fn(() => {
      globalState.isCancelling = true
    }),
    setSidebarOpen: jest.fn((open) => {
      globalState.sidebarOpen = open
    }),
    setSettingsPanelOpen: jest.fn((open) => {
      globalState.settingsPanelOpen = open
    }),
    setModelChangeLoading: jest.fn((loading) => {
      globalState.modelChangeLoading = loading
    }),
    setSearchQuery: jest.fn((query) => {
      globalState.searchQuery = query
      // Simple filter implementation for tests
      if (!query) {
        globalState.filteredConversations = globalState.conversations
      } else {
        globalState.filteredConversations = globalState.conversations.filter(conv =>
          conv.title.toLowerCase().includes(query.toLowerCase()) ||
          conv.messages?.some(msg => msg.content.toLowerCase().includes(query.toLowerCase()))
        )
      }
    }),
    filterConversations: jest.fn(),
    setTemperature: jest.fn((temp) => {
      globalState.temperature = temp
    }),
    setMaxTokens: jest.fn((tokens) => {
      globalState.maxTokens = tokens
    }),
    setSystemPrompt: jest.fn((prompt) => {
      globalState.systemPrompt = prompt
    }),
    setTheme: jest.fn((theme) => {
      globalState.theme = theme
    }),
    loadUserSettings: jest.fn(),
    saveUserSettings: jest.fn(),
    setSettingsLoading: jest.fn((loading) => {
      globalState.settingsLoading = loading
    }),
    addMessage: jest.fn((conversationId, message) => {
      globalState.conversations = globalState.conversations.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            messages: [...(conv.messages || []), message]
          }
        }
        return conv
      })
      globalState.filteredConversations = globalState.conversations
    }),
    updateMessage: jest.fn((conversationId, messageId, content) => {
      globalState.conversations = globalState.conversations.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            messages: conv.messages?.map(msg =>
              msg.id === messageId ? { ...msg, content } : msg
            ) || []
          }
        }
        return conv
      })
      globalState.filteredConversations = globalState.conversations
    }),
  }
  
  // Create a proxy that always returns current state values
  const createStoreProxy = () => {
    return new Proxy({}, {
      get(target, prop) {
        if (prop in actions) {
          return actions[prop]
        }
        if (prop === '__resetState') {
          return (newState) => {
            Object.assign(globalState, newState)
          }
        }
        return globalState[prop]
      }
    })
  }
  
  return {
    useChatStore: () => createStoreProxy(),
    __resetGlobalState: (newState) => {
      Object.assign(globalState, newState)
    }
  }
})

// Mock Prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    conversation: {
      findMany: jest.fn(),
      findFirst: jest.fn(), // Add missing findFirst method
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    message: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(), // Add transaction method for chat API tests
  }
}))
// Mock auth module
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(() => Promise.resolve({
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
    }
  }))
}))
// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.DATABASE_URL = 'file:./test.db'
process.env.OLLAMA_BASE_URL = 'http://localhost:11434'

// Mock fetch globally
global.fetch = jest.fn()

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock window.history
Object.defineProperty(window, 'history', {
  value: {
    pushState: jest.fn(),
    replaceState: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    go: jest.fn(),
  },
  writable: true,
})

// Mock document.body for testing-library
Object.defineProperty(document, 'body', {
  value: document.createElement('body'),
  writable: true,
})

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn()

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
})
// Mock Web APIs that are missing in Node.js test environment
const { TextEncoder, TextDecoder } = require('util')
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock ReadableStream for streaming tests
global.ReadableStream = class ReadableStream {
  constructor(underlyingSource = {}) {
    this.underlyingSource = underlyingSource
    this.locked = false
    this.controller = {
      enqueue: jest.fn(),
      close: jest.fn(),
      error: jest.fn(),
    }
    
    if (underlyingSource.start) {
      underlyingSource.start(this.controller)
    }
  }
  
  getReader() {
    this.locked = true
    return {
      read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
      releaseLock: jest.fn(() => { this.locked = false }),
      cancel: jest.fn(),
    }
  }
  
  cancel() {
    return Promise.resolve()
  }
}

// Mock NextRequest to avoid constructor issues
jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    constructor(url, init = {}) {
      this.url = url
      this.method = init.method || 'GET'
      this.headers = new Headers(init.headers || {})
      this.body = init.body || null
      this._bodyText = init.body || null // Store original body text
      this._bodyUsed = false
      
      // Create a proper AbortSignal mock
      this.signal = init.signal || {
        aborted: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
        onabort: null,
        reason: undefined,
        throwIfAborted: jest.fn()
      }
    }
    
    async json() {
      if (this._bodyText === null || this._bodyText === undefined) {
        return {} // Return empty object for empty body instead of throwing
      }
      if (typeof this._bodyText === 'string') {
        if (this._bodyText.trim() === '') {
          return {} // Return empty object for empty string
        }
        try {
          return JSON.parse(this._bodyText)
        } catch (error) {
          throw new SyntaxError('Unexpected token in JSON')
        }
      }
      return this._bodyText
    }
    
    async text() {
      if (this._bodyText && typeof this._bodyText === 'string') {
        return this._bodyText
      }
      return ''
    }
  },
  NextResponse: class MockNextResponse {
    constructor(body, init = {}) {
      this.body = body
      this.status = init.status || 200
      this.headers = new Headers(init.headers || {})
    }
    
    static json(data, init = {}) {
      return {
        json: () => Promise.resolve(data),
        status: init.status || 200,
        headers: new Headers(init.headers || {}),
      }
    }
    
    static next() {
      return {
        status: 200,
        headers: new Headers(),
      }
    }
    
    async json() {
      return this.body
    }
  }
}))
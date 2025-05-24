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
  const mockStore = {
    currentConversation: null,
    conversations: [],
    models: [
      { name: 'llama3.2', size: 2048000000 },
      { name: 'mistral', size: 4096000000 }
    ],
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
  
  return {
    useChatStore: () => mockStore
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
      this._bodyUsed = false
    }
    
    async json() {
      if (this.body && !this._bodyUsed) {
        this._bodyUsed = true
        return JSON.parse(this.body)
      }
      throw new Error('Body already used')
    }
    
    async text() {
      if (this.body && !this._bodyUsed) {
        this._bodyUsed = true
        return this.body
      }
      return ''
    }
  },
  NextResponse: {
    json: (data, init = {}) => ({
      json: () => Promise.resolve(data),
      status: init.status || 200,
      headers: new Headers(init.headers || {}),
    }),
    next: () => ({
      status: 200,
      headers: new Headers(),
    }),
  }
}))
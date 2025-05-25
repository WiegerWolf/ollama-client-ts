export const mockConversations = [
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
  },
  {
    id: 'conv-2',
    title: 'Second Conversation',
    model: 'llama3.2',
    currentModel: 'mistral',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    messages: [
      {
        id: 'msg-3',
        conversationId: 'conv-2',
        role: 'user',
        content: 'What is the weather like?',
        model: 'user',
        createdAt: '2024-01-02T00:00:00Z',
      },
      {
        id: 'msg-4',
        conversationId: 'conv-2',
        role: 'assistant',
        content: 'I don\'t have access to real-time weather data. You might want to check a weather service.',
        model: 'mistral',
        createdAt: '2024-01-02T00:01:00Z',
      },
    ],
    modelChanges: [
      {
        id: 'change-1',
        conversationId: 'conv-2',
        fromModel: 'llama3.2',
        toModel: 'mistral',
        changedAt: '2024-01-02T00:00:30Z',
        messageIndex: 1,
      },
    ],
    _count: { messages: 2 },
  },
]

export const mockModels = [
  {
    name: 'llama3.2',
    size: 2048000000,
    digest: 'sha256:abc123',
    modified_at: '2024-01-01T00:00:00Z',
    details: {
      format: 'gguf',
      family: 'llama',
      families: ['llama'],
      parameter_size: '3B',
      quantization_level: 'Q4_0',
    },
  },
  {
    name: 'mistral',
    size: 4096000000,
    digest: 'sha256:def456',
    modified_at: '2024-01-01T00:00:00Z',
    details: {
      format: 'gguf',
      family: 'mistral',
      families: ['mistral'],
      parameter_size: '7B',
      quantization_level: 'Q4_0',
    },
  },
  {
    name: 'codellama',
    size: 3584000000,
    digest: 'sha256:ghi789',
    modified_at: '2024-01-01T00:00:00Z',
    details: {
      format: 'gguf',
      family: 'llama',
      families: ['llama'],
      parameter_size: '7B',
      quantization_level: 'Q4_0',
    },
  },
]

export const mockUserSettings = {
  id: 'settings-1',
  userId: 'test-user-id',
  defaultModel: 'llama3.2',
  defaultTemperature: 0.7,
  maxTokens: 2048,
  systemPrompt: '',
  theme: 'light',
  ollamaUrl: 'http://localhost:11434',
  preferences: null,
  updatedAt: '2024-01-01T00:00:00Z',
}

export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

export const mockChatMessages = [
  { role: 'user', content: 'Hello' },
  { role: 'assistant', content: 'Hi there! How can I help you?' },
  { role: 'user', content: 'What is 2+2?' },
  { role: 'assistant', content: '2 + 2 = 4' },
]

export const mockStreamingChunks = [
  '{"message":{"role":"assistant","content":"Hello"},"done":false}',
  '{"message":{"role":"assistant","content":" there"},"done":false}',
  '{"message":{"role":"assistant","content":"!"},"done":false}',
  '{"message":{"role":"assistant","content":" How"},"done":false}',
  '{"message":{"role":"assistant","content":" can"},"done":false}',
  '{"message":{"role":"assistant","content":" I"},"done":false}',
  '{"message":{"role":"assistant","content":" help"},"done":false}',
  '{"message":{"role":"assistant","content":" you"},"done":false}',
  '{"message":{"role":"assistant","content":"?"},"done":false}',
  '{"done":true}',
]

export const mockThinkingContent = `
<thinking>
This is a thinking section where I analyze the problem.
Let me break this down:
1. First consideration
2. Second consideration
3. Final conclusion
</thinking>

Here is my response after thinking about it.
`

export const mockMarkdownContent = `
# Heading 1

This is a paragraph with **bold** and *italic* text.

## Code Example

\`\`\`javascript
function hello() {
  console.log("Hello, world!");
}
\`\`\`

- List item 1
- List item 2
- List item 3

> This is a blockquote

[Link to example](https://example.com)
`

export const mockApiResponses = {
  conversations: {
    success: mockConversations,
    empty: [],
    error: { error: 'Failed to fetch conversations' },
  },
  models: {
    success: { models: mockModels },
    empty: { models: [] },
    error: { error: 'Failed to fetch models' },
  },
  userSettings: {
    success: mockUserSettings,
    error: { error: 'Failed to fetch user settings' },
  },
  chat: {
    success: {
      message: {
        role: 'assistant',
        content: 'This is a test response from the chat API.',
      },
      done: true,
    },
    error: { error: 'Failed to generate response' },
  },
}
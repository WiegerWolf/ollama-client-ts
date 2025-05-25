import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// Setup MSW server for Node.js environment (Jest tests)
export const server = setupServer(...handlers)

// For Playwright tests, we need to properly configure MSW for browser environment
export function startMockServer() {
  server.listen({
    onUnhandledRequest: 'bypass' // Allow unhandled requests to pass through
  })
  console.log('🎭 Mock server started for Playwright tests')
}

export function stopMockServer() {
  server.close()
  console.log('🎭 Mock server stopped')
}

export function resetMockHandlers() {
  server.resetHandlers()
}

// Export handlers for browser-side MSW setup
export { handlers }

// Only auto-setup for Jest tests (when running in Node.js test environment)
if (typeof global !== 'undefined' && 'beforeAll' in global && 'afterEach' in global && 'afterAll' in global) {
  // Establish API mocking before all tests
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
  })

  // Reset any request handlers that we may add during the tests,
  // so they don't affect other tests
  afterEach(() => {
    server.resetHandlers()
  })

  // Clean up after the tests are finished
  afterAll(() => {
    server.close()
  })
}
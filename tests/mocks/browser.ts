import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

// Setup MSW worker for browser environment (Playwright tests)
export const worker = setupWorker(...handlers)

// Start the worker for browser-side mocking
export async function startBrowserMocking() {
  if (typeof window !== 'undefined') {
    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: {
        url: '/mockServiceWorker.js'
      }
    })
    console.log('🎭 Browser mock worker started')
  }
}

// Stop the worker
export async function stopBrowserMocking() {
  if (typeof window !== 'undefined') {
    await worker.stop()
    console.log('🎭 Browser mock worker stopped')
  }
}

// Reset handlers
export function resetBrowserHandlers() {
  if (typeof window !== 'undefined') {
    worker.resetHandlers()
  }
}
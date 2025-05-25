import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

// Setup MSW worker for browser environment (Playwright tests)
export const worker = setupWorker(...handlers)

// Start the worker for browser-side mocking
export async function startBrowserMocking() {
  if (typeof window !== 'undefined') {
    try {
      await worker.start({
        onUnhandledRequest: 'bypass',
        serviceWorker: {
          url: '/mockServiceWorker.js'
        },
        quiet: false // Enable logging for debugging
      })
      console.log('🎭 Browser mock worker started successfully')
      
      // Verify worker is active
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration && registration.active) {
        console.log('✅ Service worker is active and ready')
      } else {
        console.warn('⚠️  Service worker registration not found or not active')
      }
    } catch (error) {
      console.error('❌ Failed to start MSW browser worker:', error)
      throw error
    }
  }
}

// Stop the worker
export async function stopBrowserMocking() {
  if (typeof window !== 'undefined') {
    try {
      await worker.stop()
      console.log('🎭 Browser mock worker stopped')
    } catch (error) {
      console.error('❌ Failed to stop MSW browser worker:', error)
    }
  }
}

// Reset handlers
export function resetBrowserHandlers() {
  if (typeof window !== 'undefined') {
    try {
      worker.resetHandlers()
      console.log('🔄 MSW handlers reset')
    } catch (error) {
      console.error('❌ Failed to reset MSW handlers:', error)
    }
  }
}

// Check if worker is running
export function isBrowserMockingActive(): boolean {
  if (typeof window === 'undefined') return false
  return worker.listHandlers().length > 0
}
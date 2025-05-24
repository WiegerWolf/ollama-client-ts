/**
 * Test script to verify server-side request cancellation functionality
 */

const BASE_URL = 'http://localhost:3000';

async function testCancellation() {
  console.log('🧪 Testing server-side request cancellation...\n');

  // Test 1: Basic cancellation
  console.log('Test 1: Basic request cancellation');
  const controller = new AbortController();
  
  try {
    // Start a request
    const requestPromise = fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3.2',
        messages: [
          { role: 'user', content: 'Write a very long story about space exploration that takes at least 30 seconds to generate' }
        ],
        stream: true
      }),
      signal: controller.signal
    });

    // Cancel after 2 seconds
    setTimeout(() => {
      console.log('  ⏹️  Cancelling request...');
      controller.abort();
    }, 2000);

    const response = await requestPromise;
    console.log('  ❌ Request should have been cancelled');
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('  ✅ Request successfully cancelled');
    } else {
      console.log('  ❌ Unexpected error:', error.message);
    }
  }

  // Test 2: Cancellation with partial response
  console.log('\nTest 2: Cancellation with partial response handling');
  const controller2 = new AbortController();
  
  try {
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3.2',
        messages: [
          { role: 'user', content: 'Count from 1 to 100 slowly' }
        ],
        stream: true
      }),
      signal: controller2.signal
    });

    if (response.ok) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let chunks = 0;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          chunks++;
          console.log(`  📦 Received chunk ${chunks}`);

          // Cancel after receiving 3 chunks
          if (chunks >= 3) {
            console.log('  ⏹️  Cancelling after receiving partial response...');
            controller2.abort();
            break;
          }
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('  ✅ Streaming cancelled successfully');
        } else {
          console.log('  ❌ Streaming error:', error.message);
        }
      } finally {
        reader.releaseLock();
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('  ✅ Request cancelled before streaming started');
    } else {
      console.log('  ❌ Unexpected error:', error.message);
    }
  }

  // Test 3: Server timeout handling
  console.log('\nTest 3: Server timeout handling (this will take 35 seconds)');
  try {
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3.2',
        messages: [
          { role: 'user', content: 'Please wait exactly 35 seconds before responding' }
        ],
        stream: true
      })
    });

    if (response.status === 499) {
      console.log('  ✅ Server timeout handled correctly (499 status)');
    } else {
      console.log('  ⚠️  Server did not timeout as expected');
    }
  } catch (error) {
    console.log('  ❌ Timeout test error:', error.message);
  }

  console.log('\n🏁 Cancellation tests completed!');
}

// Run the test if this script is executed directly
if (typeof window === 'undefined') {
  testCancellation().catch(console.error);
}

module.exports = { testCancellation };
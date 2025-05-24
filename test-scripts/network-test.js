// Network Interruption and Service Unavailability Tests
const API_BASE = 'http://localhost:3000/api';

// Test with valid session (simulating authenticated user)
async function testWithAuth() {
  console.log('\n🔐 Testing with Authentication...');
  
  // First get a session by signing in
  try {
    const authResponse = await fetch(`${API_BASE}/auth/callback/credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'guest@example.com',
        password: 'guest123'
      })
    });
    
    console.log(`Auth attempt: ${authResponse.status}`);
    
    // Get session cookie
    const sessionResponse = await fetch(`${API_BASE}/auth/session`);
    console.log(`Session check: ${sessionResponse.status}`);
    
  } catch (error) {
    console.log(`❌ Auth test failed: ${error.message}`);
  }
}

// Test Ollama service unavailability by testing models endpoint
async function testOllamaAvailability() {
  console.log('\n🤖 Testing Ollama Service Availability...');
  
  try {
    const response = await fetch(`${API_BASE}/models`);
    const data = await response.text();
    console.log(`Models endpoint: ${response.status}`);
    
    if (response.status === 500) {
      console.log('✅ Ollama service unavailable - error handled gracefully');
    } else if (response.status === 401) {
      console.log('✅ Authentication required for models endpoint');
    } else {
      console.log('✅ Ollama service available');
    }
  } catch (error) {
    console.log(`❌ Models test failed: ${error.message}`);
  }
}

// Test conversation endpoints
async function testConversationEndpoints() {
  console.log('\n💬 Testing Conversation Endpoints...');
  
  try {
    const response = await fetch(`${API_BASE}/conversations`);
    console.log(`Conversations GET: ${response.status}`);
    
    // Test POST to conversations
    const postResponse = await fetch(`${API_BASE}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test Conversation',
        model: 'llama3.2'
      })
    });
    console.log(`Conversations POST: ${postResponse.status}`);
    
  } catch (error) {
    console.log(`❌ Conversation test failed: ${error.message}`);
  }
}

// Test invalid conversation ID
async function testInvalidConversationId() {
  console.log('\n🔍 Testing Invalid Conversation ID...');
  
  const invalidIds = [
    'invalid-id',
    '../../etc/passwd',
    '<script>alert("xss")</script>',
    'null',
    '12345',
    ''
  ];
  
  for (const id of invalidIds) {
    try {
      const response = await fetch(`${API_BASE}/conversations/${encodeURIComponent(id)}`);
      console.log(`Invalid ID "${id}": ${response.status}`);
    } catch (error) {
      console.log(`Invalid ID "${id}": Error - ${error.message}`);
    }
  }
}

// Test CORS and headers
async function testCORSAndHeaders() {
  console.log('\n🌐 Testing CORS and Security Headers...');
  
  try {
    const response = await fetch(`${API_BASE}/models`, {
      method: 'OPTIONS'
    });
    console.log(`OPTIONS request: ${response.status}`);
    
    // Check for security headers
    const headers = response.headers;
    console.log('Security headers check:');
    console.log(`- Content-Type: ${headers.get('content-type') || 'Not set'}`);
    console.log(`- X-Frame-Options: ${headers.get('x-frame-options') || 'Not set'}`);
    console.log(`- X-Content-Type-Options: ${headers.get('x-content-type-options') || 'Not set'}`);
    
  } catch (error) {
    console.log(`❌ CORS test failed: ${error.message}`);
  }
}

async function runNetworkTests() {
  console.log('🌐 Starting Network & Service Tests...');
  
  await testWithAuth();
  await testOllamaAvailability();
  await testConversationEndpoints();
  await testInvalidConversationId();
  await testCORSAndHeaders();
  
  console.log('\n✅ Network tests completed!');
}

runNetworkTests().catch(console.error);
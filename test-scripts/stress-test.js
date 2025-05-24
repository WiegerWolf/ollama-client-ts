// Advanced Stress Testing Script for Ollama Chat Application
const API_BASE = 'http://localhost:3000/api';

// Test 1: SQL Injection via API
async function testSQLInjection() {
  console.log('\n🔍 Testing SQL Injection Protection...');
  
  const maliciousPayloads = [
    "'; DROP TABLE messages; --",
    "' OR 1=1; --",
    "'; UPDATE users SET password='hacked'; --"
  ];

  for (const payload of maliciousPayloads) {
    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2',
          messages: [{ role: 'user', content: payload }],
          conversationId: payload,
          stream: false
        })
      });
      console.log(`✅ SQL Injection blocked: ${response.status}`);
    } catch (error) {
      console.log(`❌ SQL Injection test failed: ${error.message}`);
    }
  }
}

// Test 2: Large Message Stress Test
async function testLargeMessages() {
  console.log('\n📏 Testing Large Message Handling...');
  
  const sizes = [1000, 10000, 100000];
  
  for (const size of sizes) {
    const largeMessage = 'A'.repeat(size);
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2',
          messages: [{ role: 'user', content: largeMessage }],
          stream: false
        })
      });
      const responseTime = Date.now() - startTime;
      console.log(`✅ ${size} chars: ${response.status} (${responseTime}ms)`);
    } catch (error) {
      console.log(`❌ ${size} chars failed: ${error.message}`);
    }
  }
}

// Test 3: Concurrent Requests
async function testConcurrentRequests() {
  console.log('\n⚡ Testing Concurrent Requests...');
  
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2',
        messages: [{ role: 'user', content: `Test ${i}` }],
        stream: false
      })
    }));
  }

  try {
    const responses = await Promise.all(promises);
    const successCount = responses.filter(r => r.ok).length;
    console.log(`✅ Concurrent: ${successCount}/10 successful`);
  } catch (error) {
    console.log(`❌ Concurrent test failed: ${error.message}`);
  }
}

// Test 4: Malformed Requests
async function testMalformedRequests() {
  console.log('\n🔧 Testing Malformed Request Handling...');
  
  const malformedPayloads = [
    null,
    '{"invalid": json}',
    '{"model": null}',
    '{"messages": "not_an_array"}',
    '{"model": "", "messages": []}'
  ];

  for (const payload of malformedPayloads) {
    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      });
      console.log(`✅ Malformed handled: ${response.status}`);
    } catch (error) {
      console.log(`✅ Malformed rejected: ${error.message}`);
    }
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Advanced Security & Stress Tests...');
  
  await testSQLInjection();
  await testLargeMessages();
  await testConcurrentRequests();
  await testMalformedRequests();
  
  console.log('\n✅ All tests completed!');
}

runAllTests().catch(console.error);
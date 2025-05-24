# Testing Request Cancellation

## Overview

The request cancellation feature includes comprehensive testing tools to validate functionality, performance, and reliability. This documentation covers both interactive and automated testing approaches.

## Interactive Testing Page

### Accessing the Test Page

Navigate to `/cancellation-test` in your browser to access the interactive testing interface.

**URL**: `http://localhost:3000/cancellation-test`

### Test Interface Features

#### 1. Start Long Request
- **Purpose**: Tests manual cancellation with lengthy content generation
- **Behavior**: Sends a request for a long story about space exploration
- **Expected Duration**: 30+ seconds if not cancelled
- **Use Case**: Practice manual cancellation timing

#### 2. Cancel Request Button
- **Purpose**: Manual cancellation testing
- **Behavior**: Immediately aborts the active streaming request
- **Visual Feedback**: Button shows "Cancelling request..." state
- **Expected Result**: "✅ Request successfully cancelled!" in logs

#### 3. Test Quick Cancel
- **Purpose**: Automated cancellation testing
- **Behavior**: Starts a request and auto-cancels after 2 seconds
- **Use Case**: Consistent timing for performance testing
- **Expected Result**: "✅ Quick cancel test successful!" in logs

### Test Interface Layout

```
┌─────────────────────────────────────────────────────────┐
│ Request Cancellation Test                               │
│                                                         │
│ [Start Long Request] [Cancel Request] [Test Quick Cancel] │
│ 🔄 Streaming... / ⏸️ Ready                             │
│                                                         │
│ ┌─────────────────┐ ┌─────────────────┐                │
│ │ Response Output │ │ Test Logs       │                │
│ │                 │ │                 │                │
│ │ [Streaming      │ │ 14:30:15: Start │                │
│ │  content here]  │ │ 14:30:17: Cancel│                │
│ │                 │ │ 14:30:17: ✅ OK │                │
│ └─────────────────┘ └─────────────────┘                │
│                                                         │
│ Test Instructions:                                      │
│ 1. Start Long Request: Begins streaming request        │
│ 2. Cancel Request: Manually cancels active request     │
│ 3. Test Quick Cancel: Auto-cancels after 2 seconds    │
└─────────────────────────────────────────────────────────┘
```

### Monitoring Test Results

#### Success Indicators
- ✅ "Request successfully cancelled!" appears in logs
- Response output stops immediately
- UI returns to ready state
- Partial content is preserved
- No error messages in browser console

#### Failure Indicators
- ❌ Error messages in test logs
- Continued streaming after cancellation
- UI stuck in streaming state
- Browser console errors
- Network request timeouts

## Automated Testing Script

### Running the Test Script

Execute the automated test suite from the project root:

```bash
node test-scripts/cancellation-test.js
```

### Test Script Features

#### Test 1: Basic Request Cancellation
```javascript
// Starts a long-running request
// Cancels after 2 seconds
// Validates AbortError is thrown
```

**Expected Output**:
```
Test 1: Basic request cancellation
  ⏹️  Cancelling request...
  ✅ Request successfully cancelled
```

#### Test 2: Partial Response Handling
```javascript
// Starts streaming request
// Reads several chunks
// Cancels mid-stream
// Validates partial content handling
```

**Expected Output**:
```
Test 2: Cancellation with partial response handling
  📦 Received chunk 1
  📦 Received chunk 2
  📦 Received chunk 3
  ⏹️  Cancelling after receiving partial response...
  ✅ Streaming cancelled successfully
```

#### Test 3: Server Timeout Handling
```javascript
// Tests 30-second server timeout
// Validates timeout behavior
// Checks for proper status codes
```

**Expected Output**:
```
Test 3: Server timeout handling (this will take 35 seconds)
  ✅ Server timeout handled correctly (499 status)
### Script Configuration

#### Environment Variables
```bash
# Base URL for testing
BASE_URL=http://localhost:3000

# Test model (ensure it's available)
TEST_MODEL=llama3.2

# Timeout settings
CANCEL_DELAY=2000
SERVER_TIMEOUT=30000
```

#### Customizing Tests
```javascript
// Modify test prompts
const TEST_PROMPTS = {
  long: 'Write a very long story about space exploration...',
  count: 'Count from 1 to 100 slowly',
  timeout: 'Please wait exactly 35 seconds before responding'
}

// Adjust timing
const TIMING = {
  cancelDelay: 2000,    // 2 seconds
  chunkLimit: 3,        // Cancel after 3 chunks
  serverTimeout: 30000  // 30 seconds
}
```

## Performance Testing

### Metrics to Monitor

#### Response Time Metrics
- **Cancellation Latency**: Time from button click to request abort
- **UI Update Speed**: Time for interface to return to ready state
- **Resource Cleanup**: Time for server resources to be freed

#### Resource Usage Metrics
- **Memory Usage**: Before, during, and after cancellation
- **CPU Usage**: Server load during cancellation
- **Network Connections**: Proper connection termination

#### Database Metrics
- **Write Performance**: Time to save partial messages
- **Data Integrity**: Consistency of conversation history
- **Error Rates**: Failed database operations during cancellation

### Performance Benchmarks

#### Expected Performance
```
Cancellation Latency:    < 100ms
UI Update Speed:         < 50ms
Resource Cleanup:        < 200ms
Database Write:          < 500ms
Memory Release:          < 1000ms
```

#### Load Testing
```bash
# Run multiple concurrent cancellation tests
for i in {1..10}; do
  node test-scripts/cancellation-test.js &
done
wait
```

## Troubleshooting Tests

### Common Test Failures

#### Test 1 Failures
**Symptom**: "Request should have been cancelled" appears
**Cause**: AbortError not thrown properly
**Solution**: Check network connectivity and server status

#### Test 2 Failures
**Symptom**: No chunks received before cancellation
**Cause**: Request cancelled too quickly
**Solution**: Increase `cancelDelay` or use faster model

#### Test 3 Failures
**Symptom**: Server doesn't timeout as expected
**Cause**: Server timeout configuration issue
**Solution**: Check server timeout settings in API route

### Debug Mode

Enable detailed logging in test script:
```javascript
const DEBUG = true;

if (DEBUG) {
  console.log('Request details:', {
    url: `${BASE_URL}/api/chat`,
    method: 'POST',
    signal: controller.signal
  });
}
```

### Browser Testing

#### Manual Browser Tests
1. Open browser developer tools
2. Navigate to `/cancellation-test`
3. Monitor Network tab during tests
4. Check Console for errors
5. Verify WebSocket connections are properly closed

#### Automated Browser Tests
```javascript
// Example Playwright test
const { test, expect } = require('@playwright/test');

test('cancellation button works', async ({ page }) => {
  await page.goto('/cancellation-test');
  await page.click('[data-testid="start-long-request"]');
  await page.waitForSelector('[data-testid="cancel-request"]:not([disabled])');
  await page.click('[data-testid="cancel-request"]');
  await expect(page.locator('[data-testid="status"]')).toContainText('Ready');
});
```

## Continuous Integration

### GitHub Actions Example
```yaml
name: Test Cancellation Feature
on: [push, pull_request]

jobs:
  test-cancellation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Start server
        run: npm run dev &
      - name: Wait for server
        run: sleep 10
      - name: Run cancellation tests
        run: node test-scripts/cancellation-test.js
```

### Test Reports

Generate test reports with timing data:
```javascript
const testResults = {
  timestamp: new Date().toISOString(),
  tests: [
    {
      name: 'Basic Cancellation',
      status: 'passed',
      duration: 2150,
      details: 'Request cancelled successfully'
    }
  ]
};

// Save to file
fs.writeFileSync('test-results.json', JSON.stringify(testResults, null, 2));
```

## Best Practices for Testing

### Test Environment Setup
1. **Clean State**: Start each test with fresh browser/server state
2. **Isolated Tests**: Don't depend on previous test results
3. **Realistic Data**: Use prompts that simulate real user scenarios
4. **Timing Variations**: Test with different cancellation timings

### Test Data Management
1. **Cleanup**: Remove test conversations after testing
2. **Isolation**: Use separate test database if possible
3. **Consistency**: Use same test prompts across runs
4. **Documentation**: Record test scenarios and expected outcomes

### Monitoring and Alerts
1. **Performance Regression**: Alert if cancellation latency increases
2. **Error Rate Monitoring**: Track cancellation failure rates
3. **Resource Leaks**: Monitor for memory/connection leaks
4. **User Experience**: Track real user cancellation patterns

---

*For implementation details, see [Technical Documentation](./request-cancellation.md).*
*For user instructions, see [User Guide](./user-guide-cancellation.md).*
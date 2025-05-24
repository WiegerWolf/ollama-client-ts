# Request Cancellation Feature

## Overview

The request cancellation feature allows users to immediately stop AI model generation when responses are heading in the wrong direction, generating infinite content, or when users want to try a different approach. This feature provides instant feedback, proper resource cleanup, and maintains data integrity.

## Architecture

### Frontend Implementation

#### Chat Interface (`src/components/chat/chat-interface.tsx`)

The main chat interface implements cancellation through:

1. **AbortController Management**
   ```typescript
   const abortControllerRef = useRef<AbortController | null>(null)
   
   // Create new controller for each request
   const abortController = new AbortController()
   abortControllerRef.current = abortController
   ```

2. **Stop Button UI**
   ```typescript
   {isStreaming ? (
     <Button
       type="button"
       onClick={handleStop}
       disabled={isCancelling}
       className="px-lg py-md h-11 focus-ring bg-red-600 hover:bg-red-700 text-white"
     >
       <Square className="h-4 w-4" />
     </Button>
   ) : (
     // Send button when not streaming
   )}
   ```

3. **Cancellation Handler**
   ```typescript
   const handleStop = () => {
     if (abortControllerRef.current && !isCancelling) {
       setIsCancelling(true)
       cancelGeneration()
       abortControllerRef.current.abort()
     }
   }
   ```

#### State Management (`src/stores/chat-store.ts`)

The Zustand store manages cancellation state:
- `isStreaming`: Indicates if a request is currently active
- `isCancelling`: Prevents multiple cancellation attempts
- `cancelGeneration()`: Centralized cancellation logic

### Backend Implementation

#### API Route (`src/app/api/chat/route.ts`)

The backend implements comprehensive cancellation handling:

1. **AbortController Setup**
   ```typescript
   const abortController = new AbortController()
   let isRequestCancelled = false
   let partialAssistantMessage = ''
   ```

2. **Client Disconnection Detection**
   ```typescript
   request.signal.addEventListener('abort', () => {
     console.log('Client disconnected, aborting Ollama request')
     isRequestCancelled = true
     abortController.abort()
   })
   ```

3. **Ollama Request Forwarding**
   ```typescript
   const ollamaResponse = await fetch(`${ollamaUrl}/api/chat`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(ollamaRequest),
     signal: abortController.signal  // Forward cancellation signal
   })
   ```

4. **Streaming with Cancellation Checks**
   ```typescript
   while (true) {
     // Check for cancellation before each read
     if (abortController.signal.aborted || isRequestCancelled) {
       console.log('Request cancelled during streaming')
       break
     }
     
     const { done, value } = await ollamaReader.read()
     if (done) break
     
     // Process chunk and forward to client
   }
   ```

5. **Partial Message Handling**
   ```typescript
   // Save partial response when cancelled
   if (isRequestCancelled && conversationId && partialAssistantMessage.trim()) {
     await saveMessageToDatabase(
       conversationId,
       session.user.id,
       messages[messages.length - 1],
       { 
         role: 'assistant', 
         content: partialAssistantMessage + '\n\n[Response cancelled]' 
       },
       model
     )
   }
   ```

## Cancellation Flow

### 1. User Initiates Cancellation
- User clicks the red stop button (⏹️) in the chat interface
- `handleStop()` function is called
- UI state changes to show "Stopping..." feedback

### 2. Frontend Cancellation
- `AbortController.abort()` is called
- Fetch request is immediately cancelled
- Streaming reader stops processing new chunks
- UI returns to ready state

### 3. Backend Cancellation
- Server detects client disconnection via `request.signal`
- Ollama request is aborted using the forwarded signal
- Streaming loop exits gracefully
- Resources are cleaned up

### 4. Database Cleanup
- If partial content was generated, it's saved with "[Response cancelled]" marker
- Database integrity is maintained
- Conversation history remains consistent

### 5. Resource Cleanup
- Ollama model resources are freed immediately
- Server memory is released
- Network connections are closed
- Client returns to ready state

## Error Handling

### AbortError Handling
```typescript
catch (error) {
  if (error instanceof Error && error.name === 'AbortError') {
    console.log('Request cancelled by user')
    // Clean up streaming state
  } else {
    console.error('Error sending message:', error)
  }
}
```

### Timeout Protection
```typescript
// 30-second timeout for safety
const cancellationTimeout = setTimeout(() => {
  if (!abortController.signal.aborted) {
    console.log('Cancellation timeout reached, aborting request')
    abortController.abort()
  }
}, 30000)
```

### Resource Cleanup
```typescript
finally {
  // Always clean up resources
  if (ollamaReader) {
    try {
      ollamaReader.releaseLock()
    } catch (cleanupError) {
      console.error('Error during reader cleanup:', cleanupError)
    }
  }
  controller.close()
  clearTimeout(cancellationTimeout)
}
```

## Performance Benefits

### Immediate Resource Release
- **Ollama Model**: Stops generation immediately, freeing GPU/CPU resources
- **Network**: Closes streaming connections instantly
- **Memory**: Releases buffers and processing state
- **Database**: Prevents unnecessary writes for unwanted content

### User Experience
- **Instant Feedback**: UI responds immediately to cancellation
- **No Waiting**: Users don't have to wait for bad responses to complete
- **Quick Iteration**: Enables rapid prompt refinement and testing
- **Resource Awareness**: Users can manage server load effectively

### Server Efficiency
- **Load Management**: Prevents server overload from runaway generations
- **Fair Resource Sharing**: Allows other requests to use freed resources
- **Graceful Degradation**: Maintains service quality under high load
- **Cost Control**: Reduces computational costs for unwanted responses

## Testing and Validation

### Interactive Testing (`/cancellation-test`)
The test page provides real-time validation:
- **Long Request Test**: Generates lengthy content for manual cancellation
- **Quick Cancel Test**: Automated 2-second cancellation
- **Real-time Logs**: Shows cancellation events and timing
- **Response Monitoring**: Displays partial content and cleanup

### Automated Testing (`test-scripts/cancellation-test.js`)
Comprehensive test suite covering:
- Basic cancellation functionality
- Partial response handling
- Server timeout behavior
- Resource cleanup verification
- Error condition testing

### Monitoring Points
- Client-side: AbortError detection and UI state management
- Server-side: Request abortion and resource cleanup
- Database: Partial message storage and integrity
- Network: Connection termination and cleanup

## Troubleshooting

### Common Issues

1. **Stop Button Not Responding**
   - Check if `isStreaming` state is properly set
   - Verify AbortController is created for each request
   - Ensure `handleStop` function is properly bound

2. **Partial Messages Not Saved**
   - Verify database connection and permissions
   - Check if `conversationId` is provided
   - Ensure error handling doesn't prevent database writes

3. **Resources Not Released**
   - Check Ollama server logs for proper request termination
   - Verify timeout cleanup is working
   - Monitor server resource usage during cancellation

### Debug Information
Enable detailed logging by checking:
- Browser console for client-side cancellation events
- Server logs for Ollama request abortion
- Database logs for partial message storage
- Network tab for request termination timing

## Best Practices

### For Users
- Use cancellation when responses go off-track early
- Don't wait for bad responses to complete
- Cancel infinite or repetitive generation immediately
- Use the feature to iterate quickly on prompts

### For Developers
- Always create new AbortController for each request
- Implement proper cleanup in finally blocks
- Handle AbortError specifically in catch blocks
- Test cancellation at various stages of generation
- Monitor resource usage and cleanup effectiveness

## API Integration

### Request Format
The cancellation feature works with standard chat API requests:
```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'llama3.2',
    messages: [...],
    stream: true
  }),
  signal: abortController.signal  // Enable cancellation
})
```

### Response Handling
```typescript
const reader = response.body?.getReader()
while (true) {
  if (abortController.signal.aborted) {
    break  // Exit on cancellation
  }
  
  const { done, value } = await reader.read()
  if (done) break
  
  // Process streaming data
}
```

### Error Response
When cancelled, the server returns:
```json
{
  "error": "Request cancelled",
  "cancelled": true
}
```
Status code: `499` (Client Closed Request)
# User Guide: Request Cancellation

## Quick Start

The request cancellation feature allows you to instantly stop AI model generation when responses aren't going as expected. Look for the red **Stop** button (⏹️) that appears during generation.

## When to Use the Stop Button

### 🔄 Model Struggles with Infinite Content
**Problem**: The model gets stuck generating repetitive or infinite content that fills up the context window.

**Example**: 
```
User: "List all prime numbers"
AI: "1, 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997..."
```

**Solution**: Click the stop button immediately when you notice repetitive or endless generation.

### 🎯 Response Going in Wrong Direction
**Problem**: The AI starts responding in a way that's not what you wanted.

**Example**:
```
User: "Explain quantum computing simply"
AI: "Quantum computing is an extremely complex field that requires deep understanding of advanced mathematics, including linear algebra, complex analysis, differential equations, group theory, topology..."
```

**Solution**: Stop early and rephrase your request for a simpler explanation.

### ⚡ Quick Iteration and Testing
**Problem**: You want to test different prompts or models quickly.

**Example**: Testing different creative writing styles or comparing model responses.

**Solution**: Start a request, see the initial direction, then stop to try a different approach.

### 🔧 Resource Management
**Problem**: Server resources are limited and you want to be considerate of other users.

**Solution**: Cancel requests that aren't producing useful results to free up resources.

## How to Use the Stop Button

### 1. Start a Conversation
- Type your message in the input field
- Press **Enter** or click the **Send** button (📤)
- The interface switches to streaming mode

### 2. Monitor the Response
- Watch the AI's response as it streams in real-time
- The **Send** button changes to a red **Stop** button (⏹️)
- You'll see a "🔄 Streaming..." indicator

### 3. Cancel When Needed
- Click the red **Stop** button (⏹️) at any time during generation
- The button briefly shows "Stopping..." feedback
- Generation stops immediately and the interface returns to ready state

### 4. Review Partial Response
- Any content generated before cancellation is preserved
- You'll see "[Response cancelled]" appended to partial responses
- The conversation history is maintained
## Visual Indicators

### During Generation
```
┌─────────────────────────────────────┐
│ 🔄 Streaming...                     │
│                                     │
│ [Message input field - disabled]    │
│ [🔴 Stop] ← Red stop button         │
└─────────────────────────────────────┘
```

### After Cancellation
```
┌─────────────────────────────────────┐
│ ⏸️ Ready                            │
│                                     │
│ [Message input field - enabled]     │
│ [📤 Send] ← Send button returns     │
└─────────────────────────────────────┘
```

## What Happens When You Cancel

### Immediate Effects
1. **Generation Stops**: The AI model immediately stops generating content
2. **UI Updates**: The stop button disappears and the send button returns
3. **Input Enabled**: You can immediately type a new message
4. **Resources Freed**: Server resources are released for other requests

### Content Handling
- **Partial Content**: Any text generated before cancellation is saved
- **Cancellation Marker**: "[Response cancelled]" is appended to show the response was incomplete
- **Conversation History**: The partial response becomes part of the conversation history
- **Context Preserved**: You can continue the conversation normally

### Example of Cancelled Response
```
User: Write a long story about space exploration
AI: In the year 2157, humanity had finally achieved what many thought impossible—the first manned mission to Proxima Centauri. Captain Sarah Chen stood at the observation deck of the starship Endeavor, watching the alien sun grow larger through the reinforced viewport. The journey had taken twelve years, even with the revolutionary fusion drives that...

[Response cancelled]
```

## Performance Benefits

### For You
- **Save Time**: Don't wait for bad responses to finish
- **Better Results**: Quickly iterate to find the right prompt
- **Learn Faster**: Test different approaches rapidly
- **Stay Focused**: Avoid getting distracted by irrelevant content

### For Everyone
- **Resource Sharing**: Free up server capacity for other users
- **Faster Service**: Reduced server load means faster responses for all
- **Cost Efficiency**: Lower computational costs benefit the entire service

## Testing the Feature

### Interactive Test Page
Visit `/cancellation-test` in your browser to try the cancellation feature:

1. **Start Long Request**: Tests manual cancellation with lengthy content
2. **Cancel Request**: Practice using the stop button
3. **Test Quick Cancel**: See automated cancellation in action

### What to Expect
- Immediate response when clicking stop
- Clean transition back to input mode
- Partial content preserved with cancellation marker
- No errors or broken states

## Troubleshooting

### Stop Button Not Working
**Symptoms**: Clicking stop button has no effect
**Solutions**:
- Refresh the page and try again
- Check your internet connection
- Ensure JavaScript is enabled in your browser

### Partial Responses Not Saved
**Symptoms**: Content disappears when cancelled
**Solutions**:
- Check if you're logged in properly
- Verify the conversation was created successfully
- Try refreshing and starting a new conversation

### Slow Cancellation
**Symptoms**: Takes several seconds to stop after clicking
**Solutions**:
- This is normal for very active models
- The cancellation is still working, just be patient
- Server is cleaning up resources properly

## Best Practices

### When to Cancel
✅ **Do Cancel When**:
- Response is clearly going in wrong direction
- Model starts repeating content endlessly
- You realize you need to rephrase your question
- Content becomes inappropriate or off-topic
- You want to test a different model or approach

❌ **Don't Cancel When**:
- Response is just starting (give it a few seconds)
- Content is good but slow (be patient)
- You're just curious what happens next
- Response is almost complete

### Effective Usage
1. **Monitor Early**: Watch the first few sentences closely
2. **Cancel Quickly**: Don't wait too long if it's going wrong
3. **Rephrase**: Use cancellation as an opportunity to improve your prompt
4. **Experiment**: Try different models or settings after cancelling

## Keyboard Shortcuts

- **Enter**: Send message (when not streaming)
- **Shift + Enter**: New line in message
- **Escape**: Focus on stop button (when streaming)

## Privacy and Data

### What Gets Saved
- Partial responses with "[Response cancelled]" marker
- Your original message that triggered the response
- Timestamp of when cancellation occurred

### What Doesn't Get Saved
- The full response that would have been generated
- Any content after the cancellation point
- Server processing details or error states

## Related Features

- **Model Switching**: Change models mid-conversation for different approaches
- **Temperature Control**: Adjust creativity/randomness in settings
- **System Prompts**: Set context that applies to all messages
- **Conversation Management**: Organize your chats effectively

---

*For technical details about how cancellation works, see the [Technical Documentation](./request-cancellation.md).*
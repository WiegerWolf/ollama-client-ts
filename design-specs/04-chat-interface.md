# Chat Interface Components
**Ollama Web Chat - Chat Interface Component Specification**

## Overview

This document specifies the design and behavior of the core chat interface components, including message bubbles, chat area layout, input controls, and streaming states. These components form the heart of the user interaction experience with AI models.

## Design References

- **Foundation**: [`01-design-system.md`](01-design-system.md:1) for colors, typography, spacing, and base components
- **Layout**: [`03-main-layout.md`](03-main-layout.md:1) for overall layout context
- **Components**: Message bubbles, input area, chat controls

## Chat Interface Purpose & Context

The chat interface provides real-time conversational interaction with AI models, featuring streaming responses, message management, and intuitive input controls. Optimized for extended use sessions with focus on readability and user experience.

## Message Bubble Component

### Purpose
Displays individual chat messages with role-based styling, metadata, and interactive controls.

### Message Variants

#### User Message
- **Alignment**: Right-aligned
- **Background**: Primary Blue (`#3B82F6`)
- **Text Color**: White
- **Border Radius**: 16px (speech bubble style)
- **Max Width**: 80% of container
- **Avatar**: User icon (right side)

#### Assistant Message
- **Alignment**: Left-aligned
- **Background**: Assistant Gray (`#6B7280`) in light theme, Background Tertiary in dark theme
- **Text Color**: Text Primary
- **Border Radius**: 16px (speech bubble style)
- **Max Width**: 80% of container
- **Avatar**: Bot icon (left side)

#### System Message
- **Alignment**: Center-aligned
- **Background**: Transparent or subtle background
- **Text Color**: Text Secondary
- **Style**: Italic text, minimal styling
- **Max Width**: 60% of container
- **Avatar**: None

#### Streaming Message
- **Base**: Assistant message variant
- **Additional**: Typing indicator animation
- **Cursor**: Blinking cursor at end of text
- **Animation**: Character-by-character appearance

### Message Structure
```
MessageBubble Component
├── Avatar Container (32px diameter)
│   ├── User Icon (for user messages)
│   └── Bot Icon (for assistant messages)
├── Content Container
│   ├── Message Text (markdown support)
│   ├── Code Blocks (syntax highlighting)
│   ├── Attachments (future: files, images)
│   └── Metadata Container
│       ├── Timestamp
│       ├── Model Information (assistant only)
│       └── Message Status
└── Actions Menu (hover reveal)
    ├── Copy Message
    ├── Edit Message (user only)
    ├── Regenerate (assistant only)
    └── More Options (future)
```

### Message Specifications

#### Dimensions & Spacing
- **Max Width**: 80% of chat container
- **Padding**: 16px horizontal, 12px vertical
- **Margin**: 16px between messages, 8px between avatar and content
- **Avatar Size**: 32px diameter
- **Border Radius**: 16px for speech bubble effect

#### Typography
- **Message Text**: Body Large (16px/24px)
- **Code Blocks**: Code typography (14px/20px, monospace)
- **Metadata**: Body Small (12px/16px)
- **Timestamps**: Body Small, Text Tertiary color

#### Interactive Elements
- **Copy Button**: 24px icon button, appears on hover
- **Edit Button**: 24px icon button, user messages only
- **Regenerate Button**: 24px icon button, assistant messages only
- **Actions Menu**: Dropdown with additional options

### Message States

#### Default State
- Standard message display with content
- Subtle hover effect revealing actions
- Proper contrast and readability

#### Streaming State
- Animated typing indicator (three dots)
- Character-by-character text appearance
- Blinking cursor at text end
- 50ms delay between characters

#### Selected State
- Highlighted border (2px Primary Blue)
- Actions menu visible
- Elevated appearance with shadow

#### Error State
- Red border (2px Error Red)
- Error icon in metadata
- Error message in place of content
- Retry action available

#### Loading State
- Skeleton placeholder animation
- Pulse effect for loading content
- Maintains message structure

## Chat Area Layout

### Container Specifications
- **Max Width**: 800px for optimal readability
- **Centering**: Auto margins for horizontal centering
- **Padding**: 24px horizontal, 16px vertical
- **Scroll**: Smooth vertical scrolling
- **Background**: Background Primary

### Message Flow
- **Spacing**: 16px vertical spacing between messages
- **Grouping**: Messages from same sender grouped with reduced spacing (8px)
- **Alignment**: User messages right, assistant messages left
- **Auto-scroll**: Automatically scroll to newest message

### Empty State
```
Empty Chat State
├── Icon (Large chat bubble icon)
├── Heading ("Welcome to Ollama Chat")
├── Description ("Start a conversation with an AI model")
├── Suggestions (Optional quick-start prompts)
└── Call-to-Action ("Type a message below to begin")
```

#### Empty State Specifications
- **Position**: Vertically and horizontally centered
- **Icon**: 64px chat bubble icon, Text Tertiary color
- **Heading**: Display Medium (24px/32px), Text Primary
- **Description**: Body Large (16px/24px), Text Secondary
- **Spacing**: 24px between elements
- **Animation**: 400ms ease-out fade-in with slight scale

## Input Area Component

### Purpose
Message composition area with text input, formatting options, and send controls for user interaction.

### Input Structure
```
Input Area Component
├── Container (Full width, auto-height)
├── Textarea Container
│   ├── Textarea (auto-resize, multi-line)
│   ├── Placeholder Text
│   └── Character Counter (future)
├── Toolbar (future enhancement)
│   ├── File Upload Button
│   ├── Formatting Options
│   └── Templates Menu
└── Actions Container
    ├── Send Button
    ├── Cancel Button (when streaming)
    └── Model Selector (future)
```

### Input Specifications

#### Textarea
- **Min Height**: 44px (single line)
- **Max Height**: 120px (scrollable beyond)
- **Padding**: 12px horizontal, 10px vertical
- **Border**: 1px Border Primary, 2px Primary Blue on focus
- **Border Radius**: 8px
- **Font**: Body Large (16px/24px)
- **Resize**: Vertical auto-resize based on content

#### Send Button
- **Size**: 44px × 44px
- **Position**: Bottom-right of input area
- **Background**: Primary Blue
- **Icon**: Send arrow icon (white)
- **State**: Disabled when input empty
- **Animation**: Scale and color transitions

#### Container
- **Position**: Fixed to bottom of chat area
- **Background**: Background Primary
- **Border**: Top border, 1px Border Primary
- **Padding**: 16px
- **Shadow**: Subtle top shadow for elevation

### Input States

#### Empty State
- **Placeholder**: "Type your message here..."
- **Send Button**: Disabled (grayed out)
- **Border**: Standard border color
- **Height**: Minimum height (44px)

#### Typing State
- **Content**: User-entered text
- **Send Button**: Enabled (Primary Blue)
- **Auto-resize**: Height adjusts to content
- **Character Count**: Optional counter display

#### Ready State
- **Content**: Text ready to send
- **Send Button**: Enabled and highlighted
- **Validation**: Content validated for sending
- **Focus**: Maintained on textarea

#### Sending State
- **Send Button**: Shows spinner, disabled
- **Textarea**: Disabled during sending
- **Content**: Maintained until response starts
- **Cancel**: Cancel button appears

#### Disabled State (During Streaming)
- **Textarea**: Grayed out, disabled
- **Send Button**: Replaced with stop/cancel button
- **Placeholder**: "AI is responding..."
- **Interaction**: No user input allowed

## Streaming States & Animations

### Streaming Indicators

#### Typing Indicator
- **Animation**: Three dots with sequential fade in/out
- **Duration**: 1.5s loop
- **Position**: In assistant message bubble
- **Color**: Text Secondary

#### Text Streaming
- **Effect**: Character-by-character appearance
- **Timing**: 50ms delay between characters
- **Cursor**: Blinking cursor at text end
- **Smooth**: No jarring text jumps

#### Progress Indicators
- **Pulse Animation**: For real-time updates
- **Progress Bar**: For file uploads (future)
- **Loading Spinner**: For processing states
- **Status Text**: "AI is thinking..." or "Generating response..."

### Animation Specifications

#### Message Appearance
- **Entry**: 200ms ease-out slide-up + fade-in
- **Stagger**: 100ms delay between grouped messages
- **Smooth**: No layout shifts during animation

#### Streaming Animation
- **Character Reveal**: Smooth character-by-character
- **Cursor Blink**: 1s interval blink animation
- **Scroll Follow**: Auto-scroll follows streaming text

#### State Transitions
- **Input Enable/Disable**: 150ms ease-in-out
- **Button States**: 150ms color and scale transitions
- **Error States**: 300ms ease-in-out with subtle shake

## Interactive Controls

### Message Actions

#### Copy Message
- **Trigger**: Hover over message or right-click
- **Icon**: Copy icon (24px)
- **Action**: Copy message text to clipboard
- **Feedback**: Brief "Copied!" tooltip

#### Edit Message (User Messages)
- **Trigger**: Click edit icon or up arrow key
- **Behavior**: Replace message with editable input
- **Actions**: Save changes or cancel
- **Effect**: Regenerate conversation from that point

#### Regenerate Response (Assistant Messages)
- **Trigger**: Click regenerate icon
- **Behavior**: Request new response for same prompt
- **Loading**: Show loading state during regeneration
- **Replace**: Replace current response with new one

### Keyboard Shortcuts

#### Input Controls
- **Enter**: Send message (when not empty)
- **Shift + Enter**: New line in message
- **Ctrl/Cmd + Enter**: Force send (even when streaming)
- **Up Arrow**: Edit last user message
- **Escape**: Cancel current input or streaming

#### Message Navigation
- **Ctrl/Cmd + R**: Regenerate last response
- **Ctrl/Cmd + C**: Copy selected message
- **Tab**: Navigate through message actions

## Accessibility Features

### Screen Reader Support
- **Message Roles**: Proper ARIA roles for user/assistant messages
- **Live Regions**: Announce new messages as they arrive
- **Message Metadata**: Accessible timestamps and model info
- **Action Labels**: Clear labels for all interactive elements

### Keyboard Navigation
- **Tab Order**: Logical navigation through messages and controls
- **Focus Management**: Proper focus handling during streaming
- **Skip Links**: Quick navigation to input area
- **Message Selection**: Arrow keys for message navigation

### Visual Accessibility
- **Color Contrast**: Minimum 4.5:1 ratio for all text
- **Focus Indicators**: Clear focus rings on interactive elements
- **Text Scaling**: Responsive to user font size preferences
- **High Contrast**: Support for high contrast mode

## Performance Considerations

### Virtual Scrolling
- **Large Conversations**: Virtualize long message lists
- **Memory Management**: Remove off-screen messages from DOM
- **Smooth Scrolling**: Maintain 60fps during scroll

### Streaming Optimization
- **Efficient Updates**: Minimize DOM manipulation during streaming
- **Debounced Scroll**: Smooth auto-scroll without jank
- **Memory Cleanup**: Clean up streaming resources

### Image and Media
- **Lazy Loading**: Load images as they come into view
- **Responsive Images**: Serve appropriate sizes
- **Caching**: Cache frequently accessed content

## Error Handling

### Message Errors
- **Failed Send**: Retry button with error message
- **Network Error**: Offline indicator and retry options
- **Model Error**: Clear error message with model selection
- **Rate Limiting**: Cooldown timer with retry countdown

### Streaming Errors
- **Connection Lost**: Graceful degradation with retry
- **Partial Response**: Save partial content, offer retry
- **Timeout**: Clear timeout message with retry option
- **Model Unavailable**: Switch to available model

### Error Display Patterns
- **Inline Errors**: Within message bubbles
- **Toast Notifications**: Non-blocking error messages
- **Modal Dialogs**: Critical errors requiring action
- **Status Indicators**: Connection and model status

## Testing Requirements

### Functional Testing
- **Message Sending**: Verify all message types send correctly
- **Streaming**: Test streaming behavior and interruption
- **Actions**: Verify copy, edit, and regenerate functions
- **Keyboard**: Test all keyboard shortcuts and navigation

### Accessibility Testing
- **Screen Reader**: Verify proper announcement of messages
- **Keyboard Navigation**: Test complete keyboard accessibility
- **Color Contrast**: Verify all contrast requirements
- **Focus Management**: Test focus behavior during interactions

### Performance Testing
- **Large Conversations**: Test with hundreds of messages
- **Streaming Performance**: Verify smooth streaming animation
- **Memory Usage**: Monitor memory consumption over time
- **Scroll Performance**: Test smooth scrolling behavior
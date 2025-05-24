# Conversation Management
**Ollama Web Chat - Conversation Management Component Specification**

## Overview

This document specifies the design and behavior of conversation management components, including the conversation list, metadata display, creation and deletion actions, and various states. These components enable users to organize, navigate, and manage their chat conversations effectively.

## Design References

- **Foundation**: [`01-design-system.md`](01-design-system.md:1) for colors, typography, spacing, and base components
- **Layout**: [`03-main-layout.md`](03-main-layout.md:1) for sidebar layout context
- **Location**: Sidebar component within main layout

## Conversation Management Purpose & Context

The conversation management system provides intuitive organization and navigation of chat conversations, with chronological grouping, quick access controls, and efficient conversation lifecycle management. Designed for users who maintain multiple ongoing conversations with different AI models.

## Conversation List Component

### Purpose
Displays all user conversations in an organized, chronological list with metadata, selection states, and management actions.

### List Structure
```
Conversation List Component
├── Header Section
│   ├── New Conversation Button
│   └── Search Bar (Future Enhancement)
├── Conversation Groups
│   ├── Today Section
│   │   ├── Section Header
│   │   └── Conversation Items
│   ├── Yesterday Section
│   │   ├── Section Header
│   │   └── Conversation Items
│   ├── This Week Section
│   │   ├── Section Header
│   │   └── Conversation Items
│   └── Older Section
│       ├── Section Header
│       └── Conversation Items
└── Footer Section (Future)
    ├── Settings Link
    └── Storage Usage
```

### List Specifications

#### Container
- **Width**: 320px (full sidebar width)
- **Height**: Flexible, scrollable content
- **Padding**: 0 (items have individual padding)
- **Background**: Background Tertiary
- **Scroll**: Smooth vertical scrolling with momentum

#### Section Headers
- **Typography**: Body Medium (14px/20px)
- **Weight**: Semibold (600)
- **Color**: Text Secondary
- **Padding**: 12px 16px 8px 16px
- **Background**: Slightly darker than list background
- **Sticky**: Stick to top during scroll

#### Grouping Logic
- **Today**: Conversations from current day
- **Yesterday**: Conversations from previous day
- **This Week**: Conversations from current week (excluding today/yesterday)
- **Older**: All conversations older than current week

## Conversation List Item Component

### Purpose
Individual conversation entry displaying metadata, preview content, and management actions.

### Item Structure
```
Conversation Item Component
├── Icon Container
│   └── MessageSquare Icon (16px)
├── Content Container
│   ├── Title (conversation name)
│   ├── Metadata Row
│   │   ├── Date/Time
│   │   ├── Model Name
│   │   └── Message Count
│   └── Preview Text (last message excerpt)
└── Actions Container (hover reveal)
    ├── Delete Button
    └── More Menu (Future)
        ├── Rename Option
        ├── Export Option
        └── Duplicate Option
```

### Item Specifications

#### Dimensions & Layout
- **Height**: 72px fixed
- **Padding**: 12px horizontal, 8px vertical
- **Border Radius**: 8px
- **Margin**: 4px horizontal (for selection border)
- **Display**: Flexbox layout

#### Icon Section
- **Size**: 16px × 16px
- **Color**: Text Tertiary
- **Position**: Left-aligned, vertically centered
- **Margin**: 12px right margin

#### Content Section
- **Flex**: 1 (takes remaining space)
- **Overflow**: Hidden with ellipsis for long content

##### Title
- **Typography**: Body Medium (14px/20px)
- **Weight**: Semibold (600)
- **Color**: Text Primary
- **Lines**: Single line with ellipsis
- **Max Width**: Available space minus actions

##### Metadata Row
- **Typography**: Body Small (12px/16px)
- **Weight**: Regular (400)
- **Color**: Text Tertiary
- **Layout**: Horizontal flex with spacing
- **Separator**: " • " between items

##### Preview Text
- **Typography**: Body Small (12px/16px)
- **Weight**: Regular (400)
- **Color**: Text Secondary
- **Lines**: Single line with ellipsis
- **Content**: First 50 characters of last message

#### Actions Section
- **Width**: Auto (based on content)
- **Visibility**: Hidden by default, visible on hover
- **Alignment**: Right-aligned, vertically centered

##### Delete Button
- **Size**: 24px × 24px
- **Icon**: Trash icon
- **Color**: Text Tertiary, Error Red on hover
- **Background**: Transparent, light red on hover
- **Border Radius**: 4px

## Conversation Item States

### Default State
- **Background**: Transparent
- **Border**: None
- **Actions**: Hidden
- **Hover Effect**: Subtle background color change

### Hover State
- **Background**: Background Secondary (lighter)
- **Actions**: Fade in with 150ms transition
- **Cursor**: Pointer cursor
- **Transition**: 150ms ease-in-out

### Selected State
- **Background**: Primary Blue with 10% opacity
- **Border**: 2px Primary Blue (left border)
- **Text Color**: Slightly darker for contrast
- **Actions**: Always visible
- **Font Weight**: Title becomes bold

### Loading State
- **Content**: Skeleton animation
- **Background**: Pulse animation
- **Actions**: Hidden
- **Duration**: Until content loads

### Deleting State
- **Animation**: Fade out with slide-left
- **Duration**: 300ms ease-in-out
- **Background**: Light red background
- **Actions**: Disabled during animation

## New Conversation Component

### Purpose
Primary action button for creating new conversations with model selection.

### Button Structure
```
New Conversation Button
├── Icon (Plus icon)
├── Text ("New Conversation")
└── Dropdown (Future: Model Selection)
```

### Button Specifications
- **Width**: Full width minus 16px padding (288px)
- **Height**: 44px
- **Style**: Primary button styling
- **Icon**: Plus icon (16px)
- **Text**: "New Conversation"
- **Position**: Top of sidebar, 16px margin all sides

### Button States

#### Default State
- **Background**: Primary Blue
- **Text Color**: White
- **Icon Color**: White
- **Border**: None
- **Shadow**: Subtle elevation shadow

#### Hover State
- **Background**: Primary Blue Hover
- **Scale**: scale(1.02) with 150ms transition
- **Shadow**: Increased elevation
- **Cursor**: Pointer

#### Active State
- **Background**: Darker blue
- **Scale**: scale(0.98) with 100ms transition
- **Shadow**: Reduced elevation

#### Loading State (During Creation)
- **Background**: Primary Blue with reduced opacity
- **Icon**: Replaced with spinner
- **Text**: "Creating..."
- **Disabled**: No interaction allowed

## Conversation Actions

### Delete Conversation

#### Trigger Methods
- **Hover Delete**: Click delete button on hover
- **Context Menu**: Right-click conversation item
- **Keyboard**: Delete key when item selected

#### Confirmation Flow
1. **Immediate Feedback**: Item highlights in red
2. **Confirmation Modal**: "Delete this conversation?"
3. **Actions**: "Delete" (destructive) and "Cancel"
4. **Deletion**: Fade out animation and removal

#### Confirmation Modal
- **Title**: "Delete Conversation"
- **Message**: "This action cannot be undone. Are you sure?"
- **Buttons**: "Cancel" (secondary) and "Delete" (destructive)
- **Focus**: Default focus on "Cancel" for safety

### Select Conversation

#### Selection Behavior
- **Click**: Select conversation and load in chat area
- **Keyboard**: Arrow keys for navigation, Enter to select
- **Visual Feedback**: Immediate selection state change
- **Loading**: Show loading state while conversation loads

#### Loading Process
1. **Selection**: Immediate visual selection
2. **Loading State**: Show loading in chat area
3. **Content Load**: Load conversation messages
4. **Complete**: Display conversation in chat interface

## Empty States

### No Conversations
```
Empty Conversation List
├── Icon (Large message icon)
├── Heading ("No conversations yet")
├── Description ("Start your first conversation")
└── Call-to-Action (Highlighted new conversation button)
```

#### Empty State Specifications
- **Position**: Centered in conversation list area
- **Icon**: 48px message icon, Text Tertiary color
- **Heading**: Heading Medium (18px/24px), Text Primary
- **Description**: Body Medium (14px/20px), Text Secondary
- **Spacing**: 16px between elements
- **Animation**: 400ms ease-out fade-in

### Search No Results (Future)
```
No Search Results
├── Icon (Search icon with X)
├── Heading ("No conversations found")
├── Description ("Try different search terms")
└── Action ("Clear search")
```

## Search Functionality (Future Enhancement)

### Search Bar
- **Position**: Below new conversation button
- **Placeholder**: "Search conversations..."
- **Icon**: Search icon (left side)
- **Clear**: X button when text entered
- **Height**: 36px
- **Margin**: 0 16px 16px 16px

### Search Behavior
- **Real-time**: Filter as user types
- **Debounced**: 300ms delay for performance
- **Scope**: Search titles, content, and metadata
- **Highlighting**: Highlight matching terms
- **Clear**: Easy way to clear search and return to full list

## Responsive Behavior

### Desktop (1200px+)
- **Full Functionality**: All features available
- **Hover States**: Full hover interactions
- **Keyboard Navigation**: Complete keyboard support
- **Spacing**: Full spacing system

### Laptop (1024px-1199px)
- **Maintained Functionality**: All features preserved
- **Slightly Condensed**: Reduced padding where appropriate
- **Touch Consideration**: Larger touch targets for hybrid devices

### Tablet (768px-1023px)
- **Touch Optimized**: Larger touch targets (44px minimum)
- **Swipe Actions**: Swipe to reveal delete action
- **Tap Interactions**: Replace hover with tap interactions
- **Overlay Behavior**: Sidebar as overlay

### Mobile (320px-767px)
- **Full Screen**: Sidebar takes full screen when open
- **Touch First**: All interactions optimized for touch
- **Simplified Actions**: Streamlined action set
- **Gesture Support**: Swipe gestures for actions

## Accessibility Features

### Screen Reader Support
- **List Structure**: Proper list semantics with ARIA
- **Item Labels**: Descriptive labels for each conversation
- **Action Labels**: Clear labels for all actions
- **Live Regions**: Announce list changes

### Keyboard Navigation
- **Arrow Keys**: Navigate through conversation list
- **Enter**: Select conversation
- **Delete**: Delete selected conversation (with confirmation)
- **Tab**: Navigate to actions within items
- **Escape**: Cancel actions or close modals

### Focus Management
- **Visible Focus**: Clear focus indicators
- **Focus Trapping**: Proper focus in modals
- **Focus Restoration**: Return focus after actions
- **Skip Links**: Quick navigation options

## Performance Considerations

### Virtual Scrolling
- **Large Lists**: Virtualize for 100+ conversations
- **Memory Efficiency**: Only render visible items
- **Smooth Scrolling**: Maintain 60fps during scroll
- **Buffer**: Render small buffer above/below viewport

### Data Management
- **Lazy Loading**: Load conversation metadata as needed
- **Caching**: Cache frequently accessed conversations
- **Pagination**: Load conversations in batches
- **Search Indexing**: Efficient search implementation

### Animation Performance
- **Hardware Acceleration**: Use transform for animations
- **Reduced Motion**: Respect user motion preferences
- **Efficient Transitions**: Minimize layout thrashing
- **Debounced Updates**: Batch state updates

## Error Handling

### Loading Errors
- **Failed Load**: Show error state with retry option
- **Network Issues**: Offline indicator and cached data
- **Partial Load**: Show available data with error indicator

### Action Errors
- **Delete Failed**: Restore item with error message
- **Create Failed**: Show error in new conversation button
- **Selection Failed**: Show error and maintain previous selection

### Error Display
- **Inline Errors**: Within conversation items
- **Toast Messages**: For temporary errors
- **Error States**: Replace content with error message
- **Retry Actions**: Clear retry mechanisms

## Testing Requirements

### Functional Testing
- **CRUD Operations**: Create, read, update, delete conversations
- **Selection**: Verify conversation selection and loading
- **Search**: Test search functionality and performance
- **Actions**: Verify all conversation actions work correctly

### Accessibility Testing
- **Screen Reader**: Test with screen reader software
- **Keyboard Only**: Complete keyboard navigation testing
- **Focus Management**: Verify proper focus handling
- **ARIA Compliance**: Validate ARIA implementation

### Performance Testing
- **Large Lists**: Test with hundreds of conversations
- **Scroll Performance**: Verify smooth scrolling
- **Search Performance**: Test search with large datasets
- **Memory Usage**: Monitor memory consumption

### User Experience Testing
- **Navigation Flow**: Test conversation selection flow
- **Action Feedback**: Verify clear action feedback
- **Error Recovery**: Test error handling and recovery
- **Mobile Usability**: Test touch interactions and gestures
# Main Layout Structure
**Ollama Web Chat - Main Application Layout Specification**

## Overview

This document specifies the overall layout structure for the main chat interface of the Ollama Web Chat application. It defines the grid system, header component, sidebar structure, and responsive adaptations that form the foundation of the user experience.

## Design References

- **Foundation**: [`01-design-system.md`](01-design-system.md:1) for colors, typography, spacing, and base components
- **Route**: `/` (Main application interface)
- **Related Components**: Header, Sidebar, Chat Interface

## Layout Purpose & Context

The primary application interface where users interact with AI models through real-time chat. This is the core experience, optimized for extended use sessions with multiple conversations and designed for desktop-first usage with responsive adaptations.

## Grid System & Layout Structure

### Three-Column Layout Architecture
```
Main Application Layout
├── Header (Full Width, Fixed)
├── Content Area (Flexible Height)
│   ├── Sidebar (Fixed Width, Collapsible)
│   ├── Chat Area (Flexible Width)
│   └── Settings Panel (Fixed Width, Future)
└── Footer Input (Full Width, Auto Height)
```

### Layout Specifications

#### Overall Grid
- **Display**: CSS Grid layout
- **Grid Template**: `"header header header" "sidebar chat settings" "input input input"`
- **Grid Areas**: Named grid areas for semantic layout
- **Height**: 100vh (full viewport height)

#### Header Section
- **Height**: 60px fixed
- **Position**: Sticky top
- **Width**: Full viewport width
- **Z-index**: 100 (above other content)
- **Grid Area**: header

#### Sidebar Section
- **Width**: 320px (expanded), 0px (collapsed)
- **Position**: Fixed height, scrollable content
- **Transition**: 300ms ease-in-out width transition
- **Grid Area**: sidebar
- **Overflow**: Hidden when collapsed, scroll when expanded

#### Chat Area Section
- **Width**: Flexible, 800px max-width for readability
- **Position**: Flexible height with scroll
- **Centering**: Auto margins for content centering
- **Grid Area**: chat
- **Overflow**: Scroll for message history

#### Settings Panel (Future Enhancement)
- **Width**: 320px (when implemented)
- **Position**: Fixed height, scrollable content
- **Grid Area**: settings
- **Initial State**: Hidden/collapsed

## Header Component Specifications

### Structure & Layout
```
Header Component
├── Left Section
│   ├── Sidebar Toggle Button
│   ├── App Title/Logo
│   └── Model Indicator
├── Center Section (Future: Search)
└── Right Section
    ├── Settings Button
    ├── User Menu
    └── Sign Out Button
```

### Header Specifications
- **Height**: 60px fixed
- **Padding**: 16px horizontal
- **Background**: Background Primary (white/dark gray)
- **Border**: Bottom border, 1px Border Primary
- **Display**: Flexbox with space-between
- **Alignment**: Center vertical alignment

### Left Section Elements

#### Sidebar Toggle Button
- **Size**: 40px × 40px
- **Icon**: Hamburger menu (☰) or X when sidebar open
- **Position**: Leftmost element
- **Spacing**: 16px margin-right
- **Accessibility**: ARIA label for screen readers

#### App Title
- **Text**: "Ollama Chat"
- **Typography**: Heading Medium (18px/24px)
- **Weight**: Semibold (600)
- **Color**: Text Primary
- **Spacing**: 12px margin-right

#### Model Indicator
- **Text**: Current model name (e.g., "llama2:7b")
- **Typography**: Body Medium (14px/20px)
- **Weight**: Regular (400)
- **Color**: Text Secondary
- **Format**: "Model: {model_name}"

### Right Section Elements

#### Settings Button
- **Size**: 40px × 40px
- **Icon**: Gear/cog icon
- **State**: Highlighted when settings panel open
- **Spacing**: 8px margin-left

#### User Menu
- **Size**: 40px × 40px
- **Icon**: User avatar or initials
- **Dropdown**: User options menu
- **Spacing**: 8px margin-left

#### Sign Out Button
- **Size**: 40px × 40px
- **Icon**: Sign out icon
- **Action**: Immediate sign out
- **Spacing**: 8px margin-left

## Sidebar Component Specifications

### Structure & Layout
```
Sidebar Component
├── Header Section
│   ├── New Conversation Button
│   └── Search Bar (Future)
├── Conversation List
│   ├── Today Section
│   ├── Yesterday Section
│   ├── This Week Section
│   └── Older Section
└── Footer Section
    ├── Settings Link
    └── User Profile
```

### Sidebar Specifications
- **Width**: 320px (expanded), 0px (collapsed)
- **Background**: Background Tertiary
- **Border**: Right border, 1px Border Primary
- **Transition**: 300ms ease-in-out collapse animation
- **Scroll**: Smooth scrolling with momentum
- **Overflow**: Hidden when collapsed, auto when expanded

### Header Section

#### New Conversation Button
- **Width**: Full width minus 16px padding
- **Height**: 44px
- **Text**: "New Conversation"
- **Style**: Primary button styling
- **Icon**: Plus icon
- **Margin**: 16px all sides

#### Search Bar (Future Enhancement)
- **Width**: Full width minus 16px padding
- **Height**: 36px
- **Placeholder**: "Search conversations..."
- **Icon**: Search icon
- **Margin**: 0 16px 16px 16px

### Conversation List Section
- **Padding**: 0 16px
- **Grouping**: Conversations grouped by date
- **Scroll**: Vertical scroll when content overflows
- **Item Height**: 72px per conversation item

### Footer Section
- **Position**: Bottom of sidebar
- **Padding**: 16px
- **Border**: Top border, 1px Border Primary
- **Background**: Slightly darker than main sidebar

## Chat Area Specifications

### Layout Structure
- **Max Width**: 800px for optimal readability
- **Centering**: Auto margins for horizontal centering
- **Padding**: 24px horizontal, 16px vertical
- **Scroll**: Vertical scroll for message history
- **Background**: Background Primary

### Content Areas

#### Message Container
- **Spacing**: 16px between messages
- **Padding**: 0 24px
- **Max Width**: 100% of chat area
- **Alignment**: Messages aligned based on sender

#### Empty State
- **Position**: Centered vertically and horizontally
- **Content**: Welcome message and getting started guidance
- **Typography**: Display Medium for heading, Body Large for description
- **Spacing**: 32px between elements

#### Loading State
- **Display**: Skeleton screens for message loading
- **Animation**: Pulse animation for loading indicators
- **Duration**: Smooth transitions during loading

## Responsive Layout Adaptations

### Desktop (1200px+)
- **Sidebar**: 320px fixed, always visible
- **Chat Area**: Flexible width, 800px max-width
- **Header**: Full navigation with all controls
- **Grid**: Three-column layout fully utilized
- **Spacing**: Full spacing system applied

### Laptop (1024px-1199px)
- **Sidebar**: 280px fixed, collapsible on demand
- **Chat Area**: Flexible width, 700px max-width
- **Header**: Condensed spacing, same functionality
- **Grid**: Maintained three-column structure
- **Spacing**: Slightly reduced spacing

### Tablet (768px-1023px)
- **Sidebar**: Overlay drawer, 320px width
- **Chat Area**: Full width when sidebar closed
- **Header**: Touch-optimized buttons (44px minimum)
- **Grid**: Two-column layout (sidebar overlay)
- **Touch Targets**: Minimum 44px for all interactive elements

### Mobile (320px-767px)
- **Sidebar**: Full-screen overlay
- **Chat Area**: Full width, single column
- **Header**: Minimal controls, hamburger menu
- **Grid**: Single-column layout
- **Navigation**: Bottom-fixed input area

## Layout States & Behaviors

### Sidebar States

#### Expanded State
- **Width**: 320px
- **Content**: Fully visible conversation list
- **Animation**: Smooth expansion transition
- **Overlay**: No overlay on desktop, overlay on mobile

#### Collapsed State
- **Width**: 0px
- **Content**: Hidden with overflow hidden
- **Animation**: Smooth collapse transition
- **Chat Area**: Expands to fill available space

#### Loading State
- **Content**: Skeleton conversation items
- **Animation**: Pulse loading animation
- **Interaction**: Disabled during loading

### Chat Area States

#### Active Conversation
- **Content**: Message history displayed
- **Scroll**: Auto-scroll to latest message
- **Input**: Active and ready for new messages

#### Empty State
- **Content**: Welcome message and call-to-action
- **Centering**: Vertically and horizontally centered
- **Animation**: Fade-in transition

#### Loading State
- **Content**: Skeleton message bubbles
- **Animation**: Loading indicators
- **Scroll**: Maintained position during loading

## Accessibility Considerations

### Focus Management
- **Skip Links**: Bypass navigation to main content
- **Focus Trapping**: Proper focus management in sidebar
- **Tab Order**: Logical navigation through interface elements

### Screen Reader Support
- **Landmarks**: Proper ARIA landmarks for layout sections
- **Headings**: Semantic heading hierarchy
- **Live Regions**: Announce dynamic content changes

### Keyboard Navigation
- **Sidebar Toggle**: Keyboard accessible
- **Chat Navigation**: Arrow keys for message navigation
- **Global Shortcuts**: Keyboard shortcuts for common actions

## Performance Considerations

### Layout Optimization
- **CSS Grid**: Efficient layout calculation
- **Transform Animations**: Hardware-accelerated transitions
- **Scroll Performance**: Optimized scrolling with momentum

### Responsive Images
- **Adaptive Loading**: Load appropriate image sizes
- **Lazy Loading**: Load images as needed
- **WebP Support**: Modern image formats when supported

### Memory Management
- **Virtual Scrolling**: For large conversation lists
- **Message Cleanup**: Remove off-screen messages from DOM
- **State Optimization**: Efficient state management

## Implementation Guidelines

### CSS Architecture
- **Grid Layout**: CSS Grid for main layout structure
- **Flexbox**: Flexbox for component-level layouts
- **Custom Properties**: CSS variables for responsive values
- **Media Queries**: Mobile-first responsive design

### Component Structure
- **Layout Components**: Separate components for layout sections
- **Responsive Hooks**: React hooks for responsive behavior
- **State Management**: Global state for layout preferences

### Animation Implementation
- **CSS Transitions**: Hardware-accelerated animations
- **Reduced Motion**: Respect user motion preferences
- **Performance**: 60fps animations with proper optimization

## Testing Requirements

### Layout Testing
- **Cross-browser**: Consistent layout across browsers
- **Responsive**: Proper behavior at all breakpoints
- **Accessibility**: Screen reader and keyboard navigation

### Performance Testing
- **Layout Shift**: Minimize cumulative layout shift
- **Animation Performance**: Smooth 60fps animations
- **Memory Usage**: Efficient memory management

### User Experience Testing
- **Navigation Flow**: Intuitive navigation patterns
- **Touch Interaction**: Proper touch target sizing
- **Loading States**: Clear loading indicators
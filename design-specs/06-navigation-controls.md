# Navigation & Controls
**Ollama Web Chat - Navigation & Controls Component Specification**

## Overview

This document specifies the design and behavior of navigation elements and user controls, including header navigation, model selection interface, user controls, settings access, and mobile navigation adaptations. These components provide the primary means of application navigation and control.

## Design References

- **Foundation**: [`01-design-system.md`](01-design-system.md:1) for colors, typography, spacing, and base components
- **Layout**: [`03-main-layout.md`](03-main-layout.md:1) for header layout context
- **Location**: Header component and various control interfaces

## Navigation Purpose & Context

The navigation and control system provides intuitive access to application features, model management, user settings, and system controls. Designed for efficiency and discoverability while maintaining a clean, uncluttered interface.

## Header Navigation Component

### Purpose
Primary navigation bar providing application controls, model information, and user management across the top of the interface.

### Header Structure
```
Header Navigation Component
├── Left Section
│   ├── Sidebar Toggle Button
│   ├── App Title/Logo
│   └── Model Indicator
├── Center Section (Future Enhancement)
│   ├── Global Search Bar
│   └── Quick Actions
└── Right Section
    ├── Model Selector
    ├── Settings Button
    ├── User Menu
    └── Sign Out Button
```

### Header Specifications

#### Container
- **Height**: 60px fixed
- **Width**: Full viewport width
- **Background**: Background Primary
- **Border**: Bottom border, 1px Border Primary
- **Position**: Sticky top, z-index 100
- **Padding**: 16px horizontal

#### Layout
- **Display**: Flexbox with space-between
- **Alignment**: Center vertical alignment
- **Sections**: Three sections (left, center, right)
- **Responsive**: Adaptive layout for different screen sizes

## Left Section Components

### Sidebar Toggle Button

#### Purpose
Controls the visibility of the conversation sidebar.

#### Specifications
- **Size**: 40px × 40px
- **Icon**: Hamburger menu (☰) when closed, X when open
- **Background**: Transparent, hover background
- **Border Radius**: 8px
- **Position**: Leftmost element

#### States
- **Default**: Hamburger icon, subtle hover effect
- **Sidebar Open**: X icon, highlighted background
- **Hover**: Background Secondary, scale(1.05)
- **Active**: Background Tertiary, scale(0.95)
- **Focus**: Focus ring with keyboard navigation

#### Accessibility
- **ARIA Label**: "Toggle sidebar" / "Close sidebar"
- **Keyboard**: Space or Enter to activate
- **Screen Reader**: Announces current state

### App Title/Logo

#### Purpose
Displays application branding and serves as home link.

#### Specifications
- **Text**: "Ollama Chat"
- **Typography**: Heading Medium (18px/24px)
- **Weight**: Semibold (600)
- **Color**: Text Primary
- **Spacing**: 12px margin-left from toggle button

#### Interactive Behavior
- **Click**: Return to main chat interface
- **Hover**: Subtle color change
- **Focus**: Focus ring for keyboard navigation

### Model Indicator

#### Purpose
Shows currently selected AI model for context.

#### Specifications
- **Format**: "Model: {model_name}"
- **Typography**: Body Medium (14px/20px)
- **Weight**: Regular (400)
- **Color**: Text Secondary
- **Spacing**: 16px margin-left from app title

#### Display Examples
- "Model: llama2:7b"
- "Model: codellama:13b"
- "Model: mistral:latest"

## Right Section Components

### Model Selector

#### Purpose
Allows users to select and switch between available AI models.

#### Structure
```
Model Selector Component
├── Trigger Button
│   ├── Current Model Name
│   ├── Model Status Indicator
│   └── Dropdown Arrow
└── Dropdown Menu
    ├── Available Models List
    ├── Model Information
    └── Refresh Models Action
```

#### Trigger Button Specifications
- **Height**: 36px
- **Padding**: 8px 12px
- **Background**: Background Secondary
- **Border**: 1px Border Primary
- **Border Radius**: 8px
- **Typography**: Body Medium (14px/20px)

#### Dropdown Menu Specifications
- **Width**: 280px
- **Max Height**: 400px (scrollable)
- **Background**: Background Primary
- **Border**: 1px Border Primary
- **Border Radius**: 8px
- **Shadow**: Elevated shadow
- **Position**: Absolute, right-aligned

#### Model List Item
- **Height**: 48px
- **Padding**: 12px 16px
- **Layout**: Model name, size, and status
- **Hover**: Background Secondary
- **Selected**: Primary Blue background

#### Model Information Display
- **Model Name**: Body Medium, semibold
- **Model Size**: Body Small, Text Secondary
- **Status**: Online/Offline indicator
- **Description**: Brief model description (if available)

### Settings Button

#### Purpose
Opens application settings and preferences panel.

#### Specifications
- **Size**: 40px × 40px
- **Icon**: Gear/cog icon (20px)
- **Background**: Transparent, hover background
- **Border Radius**: 8px
- **Position**: Right section, before user menu

#### States
- **Default**: Subtle icon, hover effect
- **Settings Open**: Highlighted background, active state
- **Hover**: Background Secondary, scale(1.05)
- **Focus**: Focus ring for keyboard navigation

#### Accessibility
- **ARIA Label**: "Open settings"
- **Keyboard**: Space or Enter to activate
- **Screen Reader**: Announces settings panel state

### User Menu

#### Purpose
Provides access to user account information and actions.

#### Structure
```
User Menu Component
├── Trigger Button
│   ├── User Avatar/Initials
│   └── Dropdown Arrow (optional)
└── Dropdown Menu
    ├── User Information
    ├── Account Settings
    ├── Preferences
    ├── Help & Support
    └── Sign Out
```

#### Trigger Button Specifications
- **Size**: 40px × 40px
- **Background**: User avatar or initials circle
- **Border**: 2px transparent, Primary Blue when open
- **Border Radius**: 50% (circular)

#### Avatar Display
- **Image**: User profile image (if available)
- **Initials**: First letter of username in Primary Blue
- **Background**: Background Secondary for initials
- **Font**: Body Medium, semibold

#### Dropdown Menu Specifications
- **Width**: 200px
- **Background**: Background Primary
- **Border**: 1px Border Primary
- **Border Radius**: 8px
- **Shadow**: Elevated shadow
- **Position**: Absolute, right-aligned

### Sign Out Button

#### Purpose
Immediate sign out action for quick session termination.

#### Specifications
- **Size**: 40px × 40px
- **Icon**: Sign out icon (20px)
- **Background**: Transparent, hover background
- **Border Radius**: 8px
- **Color**: Text Secondary, Error Red on hover

#### States
- **Default**: Subtle icon
- **Hover**: Error Red color, Background Secondary
- **Active**: Darker red, scale(0.95)
- **Focus**: Focus ring with error color

#### Accessibility
- **ARIA Label**: "Sign out"
- **Keyboard**: Space or Enter to activate
- **Confirmation**: Optional confirmation dialog

## Model Selection Interface

### Model Selection Flow

#### Selection Process
1. **Trigger**: Click model selector button
2. **Dropdown**: Show available models list
3. **Selection**: Click desired model
4. **Loading**: Show loading state during switch
5. **Confirmation**: Update UI with new model
6. **Close**: Dropdown closes automatically

#### Model Loading States
- **Available**: Green indicator, normal text
- **Loading**: Spinner, "Loading..." text
- **Offline**: Red indicator, grayed out
- **Error**: Warning indicator, error message

### Model Information Display

#### Model Metadata
- **Name**: Primary model identifier
- **Version**: Model version or tag
- **Size**: Model file size
- **Status**: Availability status
- **Performance**: Speed/quality indicators (future)

#### Status Indicators
- **Online**: Green circle, "Available"
- **Offline**: Red circle, "Unavailable"
- **Loading**: Spinner, "Loading..."
- **Error**: Warning triangle, "Error"

## Mobile Navigation Adaptations

### Mobile Header (320px-767px)

#### Condensed Layout
- **Height**: 56px (slightly reduced)
- **Padding**: 12px horizontal
- **Elements**: Only essential controls visible
- **Overflow**: Additional controls in hamburger menu

#### Mobile Header Structure
```
Mobile Header
├── Hamburger Menu (All controls)
├── App Title (Centered)
└── Current Model Indicator
```

#### Hamburger Menu Contents
- Sidebar toggle
- Model selector
- Settings access
- User menu
- Sign out

### Touch Optimizations

#### Touch Targets
- **Minimum Size**: 44px × 44px for all interactive elements
- **Spacing**: 8px minimum between touch targets
- **Feedback**: Visual feedback on touch
- **Gestures**: Support for common mobile gestures

#### Mobile Interactions
- **Tap**: Primary interaction method
- **Long Press**: Context menus where appropriate
- **Swipe**: Navigation between sections
- **Pull to Refresh**: Refresh model list

## Keyboard Shortcuts & Navigation

### Global Shortcuts

#### Navigation Shortcuts
- **Ctrl/Cmd + N**: New conversation
- **Ctrl/Cmd + K**: Search conversations (future)
- **Ctrl/Cmd + ,**: Open settings
- **Ctrl/Cmd + /**: Show keyboard shortcuts help
- **Escape**: Close modals/panels

#### Model Shortcuts
- **Ctrl/Cmd + M**: Open model selector
- **Ctrl/Cmd + 1-9**: Quick model selection (future)
- **Ctrl/Cmd + R**: Refresh model list

#### Interface Shortcuts
- **Ctrl/Cmd + B**: Toggle sidebar
- **Ctrl/Cmd + Shift + S**: Open settings
- **Ctrl/Cmd + Shift + Q**: Sign out (with confirmation)

### Keyboard Navigation

#### Tab Order
1. Sidebar toggle
2. App title
3. Model selector
4. Settings button
5. User menu
6. Sign out button

#### Focus Management
- **Visible Focus**: Clear focus indicators
- **Focus Trapping**: In dropdowns and modals
- **Focus Restoration**: Return to trigger after closing
- **Skip Links**: Quick navigation to main content

## Responsive Behavior

### Desktop (1200px+)
- **Full Header**: All elements visible
- **Hover States**: Rich hover interactions
- **Tooltips**: Helpful tooltips on hover
- **Keyboard**: Complete keyboard navigation

### Laptop (1024px-1199px)
- **Maintained Layout**: All elements preserved
- **Condensed Spacing**: Slightly reduced spacing
- **Touch Consideration**: Larger targets for hybrid devices

### Tablet (768px-1023px)
- **Touch Optimized**: 44px minimum touch targets
- **Simplified Layout**: Some elements may be grouped
- **Gesture Support**: Touch gestures for navigation

### Mobile (320px-767px)
- **Minimal Header**: Essential elements only
- **Hamburger Menu**: Additional controls in menu
- **Touch First**: All interactions optimized for touch
- **Full Screen**: Efficient use of limited space

## Accessibility Features

### Screen Reader Support
- **Semantic HTML**: Proper navigation landmarks
- **ARIA Labels**: Descriptive labels for all controls
- **Live Regions**: Announce state changes
- **Role Attributes**: Proper roles for interactive elements

### Keyboard Accessibility
- **Tab Navigation**: Logical tab order
- **Keyboard Shortcuts**: Comprehensive shortcut system
- **Focus Management**: Proper focus handling
- **Escape Handling**: Consistent escape behavior

### Visual Accessibility
- **Color Contrast**: Minimum 4.5:1 ratio
- **Focus Indicators**: High contrast focus rings
- **Text Scaling**: Responsive to user preferences
- **High Contrast**: Support for high contrast mode

## Performance Considerations

### Efficient Rendering
- **Minimal Re-renders**: Optimize component updates
- **Memoization**: Cache expensive calculations
- **Lazy Loading**: Load model data as needed
- **Debounced Actions**: Prevent excessive API calls

### Model Loading
- **Background Loading**: Load models in background
- **Caching**: Cache model information
- **Progressive Enhancement**: Basic functionality first
- **Error Recovery**: Graceful error handling

## Error Handling

### Model Selection Errors
- **Model Unavailable**: Clear error message with alternatives
- **Loading Failed**: Retry mechanism with feedback
- **Network Error**: Offline indicator and cached data
- **Permission Error**: Clear permission requirements

### Navigation Errors
- **Route Errors**: Fallback to safe routes
- **State Errors**: Reset to known good state
- **Authentication Errors**: Redirect to sign-in
- **Permission Errors**: Clear access requirements

### Error Display Patterns
- **Inline Errors**: Within affected components
- **Toast Notifications**: For temporary issues
- **Modal Dialogs**: For critical errors
- **Status Indicators**: For ongoing issues

## Testing Requirements

### Functional Testing
- **Navigation**: Test all navigation paths
- **Model Selection**: Verify model switching
- **Keyboard Shortcuts**: Test all shortcuts
- **Mobile Navigation**: Test touch interactions

### Accessibility Testing
- **Screen Reader**: Complete screen reader testing
- **Keyboard Only**: Navigation without mouse
- **Focus Management**: Proper focus handling
- **ARIA Compliance**: Validate ARIA implementation

### Performance Testing
- **Model Loading**: Test model switching performance
- **Navigation Speed**: Measure navigation responsiveness
- **Memory Usage**: Monitor memory consumption
- **Mobile Performance**: Test on various devices

### User Experience Testing
- **Discoverability**: Test feature discoverability
- **Efficiency**: Measure task completion time
- **Error Recovery**: Test error handling flows
- **Mobile Usability**: Test mobile interaction patterns
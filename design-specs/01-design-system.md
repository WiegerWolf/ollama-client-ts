# Design System Foundation
**Ollama Web Chat - Core Design System Specification**

## Overview

This document establishes the foundational design system for the Ollama Web Chat application. All other components and interfaces should reference and adhere to these specifications to ensure consistency across the application.

## Design Goals

- **Desktop-First Experience**: Optimized for 1200px+ screens with responsive adaptations
- **Power User Focus**: Advanced features, keyboard shortcuts, and productivity enhancements
- **Real-time Interaction**: Seamless streaming chat with immediate visual feedback
- **Professional Aesthetics**: Clean, modern interface with excellent typography and spacing
- **Accessibility**: WCAG 2.1 AA compliance with full keyboard navigation support

## Color Palette

### Light Theme

#### Background Colors
- **Background Primary**: `#FFFFFF` (Pure white for main content areas)
- **Background Secondary**: `#F9FAFB` (Light gray for page background)
- **Background Tertiary**: `#F3F4F6` (Sidebar and secondary areas)

#### Border Colors
- **Border Primary**: `#E5E7EB` (Main borders and dividers)
- **Border Secondary**: `#D1D5DB` (Secondary borders)

#### Text Colors
- **Text Primary**: `#111827` (Main text content)
- **Text Secondary**: `#6B7280` (Secondary text, metadata)
- **Text Tertiary**: `#9CA3AF` (Placeholder text, disabled states)

### Dark Theme

#### Background Colors
- **Background Primary**: `#111827` (Main content background)
- **Background Secondary**: `#1F2937` (Page background)
- **Background Tertiary**: `#374151` (Sidebar and secondary areas)

#### Border Colors
- **Border Primary**: `#374151` (Main borders)
- **Border Secondary**: `#4B5563` (Secondary borders)

#### Text Colors
- **Text Primary**: `#F9FAFB` (Main text)
- **Text Secondary**: `#D1D5DB` (Secondary text)
- **Text Tertiary**: `#9CA3AF` (Placeholder text)

### Accent Colors

- **Primary Blue**: `#3B82F6` (User messages, primary actions)
- **Primary Blue Hover**: `#2563EB`
- **Success Green**: `#10B981` (Success states, confirmations)
- **Warning Yellow**: `#F59E0B` (Warnings, cautions)
- **Error Red**: `#EF4444` (Errors, destructive actions)
- **Assistant Gray**: `#6B7280` (Assistant message backgrounds)

## Typography

### Font Stack

- **Primary**: `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Monospace**: `"JetBrains Mono", "Fira Code", Consolas, monospace`

### Type Scale

- **Display Large**: 32px / 40px (Page titles, major headings)
- **Display Medium**: 24px / 32px (Section headings)
- **Heading Large**: 20px / 28px (Component headings)
- **Heading Medium**: 18px / 24px (Subsection headings)
- **Body Large**: 16px / 24px (Primary body text)
- **Body Medium**: 14px / 20px (Secondary body text, UI labels)
- **Body Small**: 12px / 16px (Metadata, timestamps, captions)
- **Code**: 14px / 20px (Code blocks, technical content)

### Font Weights

- **Regular**: 400 (Body text, secondary content)
- **Medium**: 500 (UI labels, emphasized text)
- **Semibold**: 600 (Headings, important labels)
- **Bold**: 700 (Major headings, critical information)

## Spacing System

### Base Unit: 4px

- **xs**: 4px (Tight spacing, icon gaps)
- **sm**: 8px (Small component spacing)
- **md**: 12px (Medium component spacing)
- **lg**: 16px (Large component spacing)
- **xl**: 20px (Section spacing)
- **2xl**: 24px (Major section spacing)
- **3xl**: 32px (Page-level spacing)
- **4xl**: 48px (Major layout spacing)

## Base Component Standards

### Buttons

- **Height**: 44px (Primary), 36px (Secondary), 28px (Small)
- **Padding**: 16px horizontal, 12px vertical
- **Border Radius**: 8px
- **Font Weight**: 500 (Medium)
- **Transition**: 150ms ease-in-out

#### Button States
- **Default**: Base styling with hover effects
- **Hover**: 150ms ease-in-out scale(1.02)
- **Active/Press**: 100ms ease-out scale(0.98)
- **Focus**: 2px blue outline with 2px offset
- **Disabled**: Reduced opacity, no interactions

### Input Fields

- **Height**: 44px (Single line), Auto (Textarea)
- **Padding**: 12px horizontal, 10px vertical
- **Border**: 1px solid border color
- **Border Radius**: 8px
- **Focus Ring**: 2px blue outline with 2px offset

#### Input States
- **Default**: Standard border and background
- **Focus**: Blue border and focus ring
- **Error**: Red border with error message
- **Disabled**: Grayed out appearance
- **Success**: Green border for validation

### Cards & Containers

- **Border Radius**: 12px (Large cards), 8px (Small cards)
- **Shadow**: 
  - Light: `0 1px 3px rgba(0, 0, 0, 0.1)`
  - Elevated: `0 4px 6px rgba(0, 0, 0, 0.1)`
- **Padding**: 16px (Standard), 24px (Large)

## Animation & Transitions

### Micro-interactions

- **Button Hover**: 150ms ease-in-out scale(1.02)
- **Button Press**: 100ms ease-out scale(0.98)
- **Focus Ring**: 200ms ease-in-out opacity
- **Loading Spinner**: 1s linear infinite rotation

### Layout Transitions

- **Sidebar Toggle**: 300ms ease-in-out width transition
- **Message Appearance**: 200ms ease-out slide-up + fade-in
- **Streaming Text**: Character-by-character with 50ms delay
- **Page Transitions**: 250ms ease-in-out opacity

### State Changes

- **Error States**: 300ms ease-in-out red border + shake
- **Success States**: 200ms ease-out green flash
- **Loading States**: Skeleton fade-in over 150ms
- **Empty States**: 400ms ease-out fade-in with slight scale

## Accessibility Guidelines

### Color Contrast

- **Minimum Ratio**: 4.5:1 for normal text
- **Large Text**: 3:1 for text 18px+ or 14px+ bold
- **UI Components**: 3:1 for interactive elements

### Focus Management

- **Visible Indicators**: Clear focus rings on all interactive elements
- **Logical Order**: Tab navigation follows visual hierarchy
- **Skip Links**: Bypass navigation for screen readers

### Keyboard Navigation

- **Tab**: Navigate through interactive elements
- **Shift + Tab**: Reverse navigation
- **Enter/Space**: Activate buttons and links
- **Escape**: Close modals and panels
- **Arrow Keys**: Navigate lists and menus

### Screen Reader Support

- **Semantic HTML**: Proper heading hierarchy and landmarks
- **ARIA Labels**: Descriptive labels for complex interactions
- **Live Regions**: Announce dynamic content changes
- **Alternative Text**: Meaningful descriptions for images

## Responsive Behavior

### Breakpoint Strategy

- **Desktop**: 1200px+ (Primary target)
- **Laptop**: 1024px-1199px (Secondary target)
- **Tablet**: 768px-1023px (Touch adaptations)
- **Mobile**: 320px-767px (Mobile adaptations)

### Touch Adaptations

#### Minimum Touch Targets
- **Buttons**: 44px × 44px minimum
- **List Items**: 48px minimum height
- **Input Fields**: 44px minimum height
- **Icon Buttons**: 40px × 40px minimum

#### Gesture Support
- **Swipe**: Left/right to open/close sidebar
- **Pull to Refresh**: Reload conversation list
- **Long Press**: Context menus for messages
- **Pinch to Zoom**: Text scaling support

## Implementation Guidelines

### CSS Architecture

- **Utility-First**: Tailwind CSS for rapid development
- **Component Styles**: CSS modules for complex components
- **Custom Properties**: CSS variables for theming
- **Responsive Design**: Mobile-first media queries

### Theme Implementation

Use CSS custom properties for easy theme switching:

```css
:root {
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f9fafb;
  --color-text-primary: #111827;
  /* ... other variables */
}

[data-theme="dark"] {
  --color-bg-primary: #111827;
  --color-bg-secondary: #1f2937;
  --color-text-primary: #f9fafb;
  /* ... other variables */
}
```

### Component Consistency

All components should:
- Follow the established spacing system
- Use the defined color palette
- Implement proper accessibility features
- Support both light and dark themes
- Include appropriate animations and transitions

## Usage Notes

- This design system serves as the foundation for all other specification documents
- Components should reference these specifications rather than duplicating them
- Any deviations from these standards should be documented and justified
- Regular audits should ensure consistency across the application
"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { ChatInterface } from "@/components/chat/chat-interface"

// Mock chat content for testing
function TestChatContent() {
  return (
    <div className="flex-1 flex items-center justify-center bg-primary">
      <div className="text-center max-w-[800px] mx-auto px-2xl">
        <div className="text-display-medium text-primary mb-lg">
          Component Specification Test
        </div>
        <div className="text-body-large text-secondary mb-2xl">
          Testing the updated header, sidebar, and chat interface components with exact specifications from the design system.
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-lg text-left">
          <div className="bg-secondary p-lg rounded-lg">
            <h3 className="text-heading-medium text-primary mb-md">Header Updates</h3>
            <ul className="text-body-medium text-secondary space-y-xs">
              <li>✓ 40px × 40px icon buttons</li>
              <li>✓ Proper left/right sections</li>
              <li>✓ Model indicator display</li>
              <li>✓ ARIA accessibility labels</li>
              <li>✓ Toggle icon (☰/✕) behavior</li>
            </ul>
          </div>
          
          <div className="bg-secondary p-lg rounded-lg">
            <h3 className="text-heading-medium text-primary mb-md">Sidebar Updates</h3>
            <ul className="text-body-medium text-secondary space-y-xs">
              <li>✓ Date grouping (Today, Yesterday, etc.)</li>
              <li>✓ 320px width when expanded</li>
              <li>✓ Footer with user profile</li>
              <li>✓ Loading skeleton screens</li>
              <li>✓ Smooth transitions</li>
            </ul>
          </div>
          
          <div className="bg-secondary p-lg rounded-lg">
            <h3 className="text-heading-medium text-primary mb-md">Chat Updates</h3>
            <ul className="text-body-medium text-secondary space-y-xs">
              <li>✓ 800px max-width constraint</li>
              <li>✓ Proper message centering</li>
              <li>✓ 16px spacing between messages</li>
              <li>✓ Enhanced empty state</li>
              <li>✓ Improved scroll behavior</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LayoutTest() {
  return (
    <MainLayout
      header={<Header />}
      sidebar={<Sidebar />}
      chat={<TestChatContent />}
    />
  )
}
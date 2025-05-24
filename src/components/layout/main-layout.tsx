"use client"

import { ReactNode } from "react"
import { useChatStore } from "@/stores/chat-store"

interface MainLayoutProps {
  header: ReactNode
  sidebar: ReactNode
  chat: ReactNode
  children?: ReactNode
}

export function MainLayout({ header, sidebar, chat }: MainLayoutProps) {
  const { sidebarOpen } = useChatStore()

  return (
    <div className="main-grid-layout">
      {/* Header Area */}
      <header className="main-grid-header">
        {header}
      </header>

      {/* Sidebar Area */}
      <aside className={`main-grid-sidebar ${sidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
        {sidebar}
      </aside>

      {/* Chat Area */}
      <main className="main-grid-chat">
        {chat}
      </main>

      {/* Settings Area - Hidden for now, prepared for future */}
      <div className="main-grid-settings">
        {/* Future settings panel */}
      </div>

      {/* Input Area - Prepared for future */}
      <div className="main-grid-input">
        {/* Future input area */}
      </div>
    </div>
  )
}
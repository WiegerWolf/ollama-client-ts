"use client"

import { Menu, X, Settings, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModelSelector } from "@/components/ui/model-selector"
import { useChatStore } from "@/stores/chat-store"
import { useSession, signOut } from "next-auth/react"

export function Header() {
  const { sidebarOpen, setSidebarOpen, settingsPanelOpen, setSettingsPanelOpen } = useChatStore()
  const { data: session } = useSession()

  return (
    <header className="bg-bg-primary border-b border-border-primary h-[60px] px-lg flex items-center justify-between shadow-light">
      {/* Left Section */}
      <div className="flex items-center space-md">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-10 h-10 focus-ring"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        
        <div className="flex items-center space-md">
          <h1 className="text-heading-medium text-text-primary font-semibold">
            Ollama Chat
          </h1>
          
          <div className="hidden sm:flex items-center">
            <span className="text-body-small text-text-tertiary mr-xs">•</span>
            <ModelSelector />
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-xs">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSettingsPanelOpen(!settingsPanelOpen)}
          className={`w-10 h-10 focus-ring ${settingsPanelOpen ? 'bg-bg-secondary' : ''}`}
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 focus-ring"
          aria-label={`User menu for ${session?.user?.name || session?.user?.email}`}
        >
          <User className="h-5 w-5" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => signOut()}
          className="w-10 h-10 focus-ring ml-sm"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
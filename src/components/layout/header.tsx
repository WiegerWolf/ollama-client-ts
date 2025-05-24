"use client"

import { Menu, X, Settings, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useChatStore } from "@/stores/chat-store"
import { useSession, signOut } from "next-auth/react"

export function Header() {
  const { sidebarOpen, setSidebarOpen, selectedModel } = useChatStore()
  const { data: session } = useSession()

  return (
    <header className="bg-primary border-b border-primary h-[60px] px-lg flex items-center justify-between">
      {/* Left Section */}
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-10 h-10 mr-lg"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        
        <h1 className="text-heading-medium text-primary font-semibold mr-md">
          Ollama Chat
        </h1>
        
        {selectedModel && (
          <span className="text-body-medium text-secondary">
            Model: {selectedModel}
          </span>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 ml-sm"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 ml-sm"
          aria-label={`User menu for ${session?.user?.name || session?.user?.email}`}
        >
          <User className="h-5 w-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => signOut()}
          className="w-10 h-10 ml-sm"
          aria-label="Sign out"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
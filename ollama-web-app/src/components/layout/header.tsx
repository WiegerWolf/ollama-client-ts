"use client"

import { Menu, Settings, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useChatStore } from "@/stores/chat-store"
import { useSession, signOut } from "next-auth/react"

export function Header() {
  const { sidebarOpen, setSidebarOpen, selectedModel } = useChatStore()
  const { data: session } = useSession()

  return (
    <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Ollama Chat
            </h1>
            {selectedModel && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                • {selectedModel}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {session?.user?.name || session?.user?.email}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut()}
            >
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
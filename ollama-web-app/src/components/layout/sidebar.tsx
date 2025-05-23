"use client"

import { useEffect, useState } from "react"
import { Plus, MessageSquare, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useChatStore } from "@/stores/chat-store"
import { formatRelativeTime, generateConversationTitle } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface Conversation {
  id: string
  title: string
  model: string
  createdAt: string
  updatedAt: string
  _count?: {
    messages: number
  }
}

export function Sidebar() {
  const {
    conversations,
    currentConversation,
    setCurrentConversation,
    setConversations,
    deleteConversation,
    selectedModel
  } = useChatStore()
  
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations')
      if (response.ok) {
        const data = await response.json()
        setConversations(data)
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const createNewConversation = async () => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Conversation',
          model: selectedModel,
        }),
      })

      if (response.ok) {
        const newConversation = await response.json()
        setCurrentConversation({
          ...newConversation,
          messages: []
        })
        fetchConversations() // Refresh the list
      }
    } catch (error) {
      console.error('Error creating conversation:', error)
    }
  }

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        deleteConversation(id)
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
    }
  }

  const selectConversation = async (conversation: Conversation) => {
    try {
      const response = await fetch(`/api/conversations/${conversation.id}`)
      if (response.ok) {
        const fullConversation = await response.json()
        setCurrentConversation(fullConversation)
      }
    } catch (error) {
      console.error('Error fetching conversation:', error)
    }
  }

  return (
    <div className="h-full bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <Button
          onClick={createNewConversation}
          className="w-full justify-start"
          variant="outline"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Conversation
        </Button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">
            Loading conversations...
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No conversations yet
          </div>
        ) : (
          <div className="p-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => selectConversation(conversation)}
                className={cn(
                  "group flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 mb-1",
                  currentConversation?.id === conversation.id &&
                    "bg-gray-200 dark:bg-gray-700"
                )}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <MessageSquare className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {conversation.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatRelativeTime(conversation.updatedAt)} • {conversation.model}
                    </p>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 h-6 w-6"
                  onClick={(e) => handleDeleteConversation(conversation.id, e)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
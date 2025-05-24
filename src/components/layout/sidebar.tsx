"use client"

import { useEffect, useState } from "react"
import { Plus, MessageSquare, Trash2, Settings, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useChatStore } from "@/stores/chat-store"
import { formatRelativeTime, generateConversationTitle } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { useSession } from "next-auth/react"

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

interface GroupedConversations {
  today: Conversation[]
  yesterday: Conversation[]
  thisWeek: Conversation[]
  older: Conversation[]
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
  
  const { data: session } = useSession()
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

  const groupConversationsByDate = (conversations: Conversation[]): GroupedConversations => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const thisWeekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    return conversations.reduce(
      (groups, conversation) => {
        const conversationDate = new Date(conversation.updatedAt)
        const conversationDay = new Date(conversationDate.getFullYear(), conversationDate.getMonth(), conversationDate.getDate())

        if (conversationDay.getTime() === today.getTime()) {
          groups.today.push(conversation)
        } else if (conversationDay.getTime() === yesterday.getTime()) {
          groups.yesterday.push(conversation)
        } else if (conversationDay.getTime() >= thisWeekStart.getTime()) {
          groups.thisWeek.push(conversation)
        } else {
          groups.older.push(conversation)
        }

        return groups
      },
      { today: [], yesterday: [], thisWeek: [], older: [] } as GroupedConversations
    )
  }

  const groupedConversations = groupConversationsByDate(conversations)

  const renderConversationGroup = (title: string, conversations: Conversation[]) => {
    if (conversations.length === 0) return null

    return (
      <div className="mb-lg">
        <h3 className="text-body-small text-tertiary font-medium px-lg mb-sm uppercase tracking-wide">
          {title}
        </h3>
        <div className="px-lg space-y-xs">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => selectConversation(conversation)}
              className={cn(
                "group flex items-center justify-between p-md rounded-lg cursor-pointer transition-layout hover:bg-secondary",
                currentConversation?.id === conversation.id && "bg-secondary"
              )}
            >
              <div className="flex items-center space-md flex-1 min-w-0">
                <MessageSquare className="h-4 w-4 text-secondary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-body-medium text-primary font-medium truncate">
                    {conversation.title}
                  </p>
                  <p className="text-body-small text-secondary">
                    {formatRelativeTime(conversation.updatedAt)} • {conversation.model}
                  </p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 h-6 w-6 transition-fast"
                onClick={(e) => handleDeleteConversation(conversation.id, e)}
                aria-label={`Delete conversation: ${conversation.title}`}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-tertiary border-r border-primary flex flex-col">
      {/* Header Section */}
      <div className="p-lg">
        <Button
          onClick={createNewConversation}
          className="w-full justify-start h-11"
          variant="default"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Conversation
        </Button>
      </div>

      {/* Conversation List Section */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-lg">
            {/* Loading skeleton */}
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center space-md p-md mb-xs">
                <div className="w-4 h-4 bg-secondary rounded animate-pulse" />
                <div className="flex-1">
                  <div className="w-3/4 h-4 bg-secondary rounded animate-pulse mb-xs" />
                  <div className="w-1/2 h-3 bg-secondary rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-lg text-center text-secondary">
            <MessageSquare className="h-8 w-8 mx-auto mb-md text-tertiary" />
            <p className="text-body-medium">No conversations yet</p>
            <p className="text-body-small text-tertiary mt-xs">
              Create your first conversation to get started
            </p>
          </div>
        ) : (
          <div className="py-sm">
            {renderConversationGroup("Today", groupedConversations.today)}
            {renderConversationGroup("Yesterday", groupedConversations.yesterday)}
            {renderConversationGroup("This Week", groupedConversations.thisWeek)}
            {renderConversationGroup("Older", groupedConversations.older)}
          </div>
        )}
      </div>

      {/* Footer Section */}
      <div className="border-t border-primary p-lg bg-tertiary">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-md">
            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body-small text-primary font-medium truncate">
                {session?.user?.name || session?.user?.email || 'User'}
              </p>
              <p className="text-body-small text-tertiary">
                {session?.user?.email && session?.user?.name ? session.user.email : 'Signed in'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
"use client"

import { useEffect, useState, useCallback, memo } from "react"
import { Plus, MessageSquare, Trash2, Settings, User, Search, X, Edit2, Check, X as XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useChatStore } from "@/stores/chat-store"
import { formatRelativeTime, generateConversationTitle } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"

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
    updateConversation,
    selectedModel,
    searchQuery,
    filteredConversations,
    setSearchQuery,
    navigateToConversation
  } = useChatStore()
  
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  useEffect(() => {
    fetchConversations()
  }, []) // Empty dependency array is correct here

  const fetchConversations = useCallback(async () => {
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
  }, [setConversations])

  const createNewConversation = useCallback(async () => {
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
        // Navigate to the new conversation
        router.push(`/conversation/${newConversation.id}`)
        fetchConversations() // Refresh the list
      }
    } catch (error) {
      console.error('Error creating conversation:', error)
    }
  }, [selectedModel, router, fetchConversations])

  const handleDeleteConversation = useCallback(async (id: string, e: React.MouseEvent) => {
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
  }, [deleteConversation])

  const selectConversation = useCallback((conversation: Conversation) => {
    // Navigate to the conversation URL
    router.push(`/conversation/${conversation.id}`)
  }, [router])

  const startEditingTitle = useCallback((conversation: Conversation, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(conversation.id)
    setEditingTitle(conversation.title)
  }, [])

  const cancelEditingTitle = useCallback(() => {
    setEditingId(null)
    setEditingTitle('')
  }, [])

  const saveTitle = useCallback(async (conversationId: string) => {
    if (!editingTitle.trim()) {
      cancelEditingTitle()
      return
    }

    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editingTitle.trim()
        }),
      })

      if (response.ok) {
        const updatedConversation = await response.json()
        updateConversation(conversationId, { title: updatedConversation.title })
        cancelEditingTitle()
      }
    } catch (error) {
      console.error('Error updating conversation title:', error)
      cancelEditingTitle()
    }
  }, [editingTitle, updateConversation, cancelEditingTitle])

  const handleTitleKeyPress = useCallback((e: React.KeyboardEvent, conversationId: string) => {
    if (e.key === 'Enter') {
      saveTitle(conversationId)
    } else if (e.key === 'Escape') {
      cancelEditingTitle()
    }
  }, [saveTitle, cancelEditingTitle])

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

  // Use filtered conversations if there's a search query, otherwise use all conversations
  const conversationsToShow = searchQuery.trim() ? filteredConversations : conversations
  const groupedConversations = groupConversationsByDate(conversationsToShow)

  // Get current conversation ID from URL
  const currentConversationId = pathname.startsWith('/conversation/')
    ? pathname.split('/conversation/')[1]
    : null

  const renderConversationGroup = useCallback((title: string, conversations: Conversation[]) => {
    if (conversations.length === 0) return null

    return (
      <div className="mb-xl">
        <h3 className="text-body-small text-text-tertiary font-semibold px-lg mb-md uppercase tracking-wide">
          {title}
        </h3>
        <div className="px-md space-y-xs">
          {conversations.map((conversation) => (
            <Link
              key={conversation.id}
              href={`/conversation/${conversation.id}`}
              className={cn(
                "group flex items-center justify-between p-md rounded-lg cursor-pointer transition-all duration-150 hover:bg-bg-secondary border border-transparent hover:border-border-primary block",
                currentConversationId === conversation.id && "bg-bg-secondary border-border-primary shadow-sm",
                editingId === conversation.id && "cursor-default pointer-events-none"
              )}
              onClick={(e) => {
                if (editingId === conversation.id) {
                  e.preventDefault()
                }
              }}
              data-testid={`conversation-${conversation.id}`}
            >
              <div className="flex items-center space-md flex-1 min-w-0">
                <MessageSquare className="h-4 w-4 text-text-secondary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  {editingId === conversation.id ? (
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => handleTitleKeyPress(e, conversation.id)}
                      onBlur={() => saveTitle(conversation.id)}
                      className="w-full text-body-medium text-text-primary font-medium bg-bg-primary border border-border-primary rounded px-xs py-xs focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                      autoFocus
                    />
                  ) : (
                    <p
                      className="text-body-medium text-text-primary font-medium truncate cursor-pointer hover:text-primary-blue transition-colors"
                      onClick={(e) => startEditingTitle(conversation, e)}
                      title="Click to edit title"
                    >
                      {conversation.title}
                    </p>
                  )}
                  <p className="text-body-small text-text-tertiary">
                    {formatRelativeTime(conversation.updatedAt)} • {conversation.model}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-xs">
                {editingId === conversation.id ? (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 transition-all duration-150 hover:bg-success-green hover:text-white focus-ring"
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        saveTitle(conversation.id)
                      }}
                      aria-label="Save title"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 transition-all duration-150 hover:bg-bg-tertiary focus-ring"
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        cancelEditingTitle()
                      }}
                      aria-label="Cancel editing"
                    >
                      <XIcon className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 h-7 w-7 transition-all duration-150 hover:bg-primary-blue hover:text-white focus-ring"
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        startEditingTitle(conversation, e)
                      }}
                      aria-label={`Edit title: ${conversation.title}`}
                      data-testid={`edit-title-${conversation.id}`}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 h-7 w-7 transition-all duration-150 hover:bg-error-red hover:text-white focus-ring"
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        handleDeleteConversation(conversation.id, e)
                      }}
                      aria-label={`Delete conversation: ${conversation.title}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    )
  }, [currentConversationId, editingId, editingTitle, setEditingTitle, handleTitleKeyPress, saveTitle, startEditingTitle, cancelEditingTitle, handleDeleteConversation])

  return (
    <nav className="h-full bg-bg-tertiary border-r border-border-primary flex flex-col shadow-light" aria-label="Conversations" role="navigation">
      {/* Header Section */}
      <div className="p-lg border-b border-border-primary bg-bg-secondary">
        <Button
          onClick={createNewConversation}
          className="w-full justify-start h-11 focus-ring mb-md"
          variant="default"
          aria-label="New conversation"
          data-testid="new-conversation-button"
        >
          <Plus className="h-4 w-4 mr-md" />
          New Conversation
        </Button>
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-md top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-sm bg-bg-primary border border-border-primary rounded-lg text-body-medium text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent"
            aria-label="Search conversations"
            role="searchbox"
            data-testid="search-conversations"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-md top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary hover:text-text-primary transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Conversation List Section */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-lg">
            {/* Loading skeleton */}
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center space-md p-md mb-xs">
                <div className="w-4 h-4 bg-bg-secondary rounded animate-pulse" />
                <div className="flex-1">
                  <div className="w-3/4 h-4 bg-bg-secondary rounded animate-pulse mb-xs" />
                  <div className="w-1/2 h-3 bg-bg-secondary rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : conversationsToShow.length === 0 ? (
          <div className="p-lg text-center">
            <div className="bg-bg-secondary rounded-full p-lg mb-lg mx-auto w-fit">
              {searchQuery.trim() ? (
                <Search className="h-8 w-8 mx-auto text-text-tertiary" />
              ) : (
                <MessageSquare className="h-8 w-8 mx-auto text-text-tertiary" />
              )}
            </div>
            {searchQuery.trim() ? (
              <>
                <p className="text-body-medium text-text-secondary">No results found</p>
                <p className="text-body-small text-text-tertiary mt-xs">
                  Try adjusting your search terms
                </p>
              </>
            ) : (
              <>
                <p className="text-body-medium text-text-secondary">No conversations yet</p>
                <p className="text-body-small text-text-tertiary mt-xs">
                  Create your first conversation to get started
                </p>
                <Button
                  onClick={createNewConversation}
                  className="mt-lg"
                  variant="default"
                  data-testid="start-conversation-button"
                >
                  Start your first conversation
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="py-lg">
            {renderConversationGroup("Today", groupedConversations.today)}
            {renderConversationGroup("Yesterday", groupedConversations.yesterday)}
            {renderConversationGroup("This Week", groupedConversations.thisWeek)}
            {renderConversationGroup("Older", groupedConversations.older)}
          </div>
        )}
      </div>

      {/* Footer Section */}
      <div className="border-t border-border-primary p-lg bg-bg-secondary">
        <div className="flex items-center space-md">
          <div className="w-9 h-9 bg-primary-blue rounded-full flex items-center justify-center border-2 border-primary-blue">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-body-small text-text-primary font-medium truncate">
              {session?.user?.name || session?.user?.email || 'User'}
            </p>
            <p className="text-body-small text-text-tertiary">
              {session?.user?.email && session?.user?.name ? session.user.email : 'Signed in'}
            </p>
          </div>
        </div>
      </div>
    </nav>
  )
}
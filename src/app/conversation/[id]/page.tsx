"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { ChatInterface } from "@/components/chat/chat-interface"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { MainLayout } from "@/components/layout/main-layout"
import { useChatStore } from "@/stores/chat-store"

export default function ConversationPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const conversationId = params.id as string
  
  const { 
    setCurrentConversation, 
    currentConversation,
    conversations,
    setConversations 
  } = useChatStore()
  
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (status === "loading") return // Still loading

    if (!session) {
      // Preserve the current conversation URL as callbackUrl
      const currentUrl = `/conversation/${conversationId}`
      const callbackUrl = encodeURIComponent(currentUrl)
      router.push(`/auth/signin?callbackUrl=${callbackUrl}`)
      return
    }

    // Load the specific conversation
    loadConversation()
  }, [session, status, router, conversationId])

  const loadConversation = async () => {
    try {
      setIsLoading(true)
      setNotFound(false)

      // Validate conversation ID format
      if (!conversationId || typeof conversationId !== 'string' || conversationId.trim() === '') {
        setNotFound(true)
        return
      }

      // First, load all conversations to populate the sidebar
      const conversationsResponse = await fetch('/api/conversations')
      if (conversationsResponse.ok) {
        const allConversations = await conversationsResponse.json()
        setConversations(allConversations)
      }

      // Then load the specific conversation
      const response = await fetch(`/api/conversations/${conversationId}`)
      if (response.ok) {
        const conversation = await response.json()
        setCurrentConversation(conversation)
      } else if (response.status === 404) {
        setNotFound(true)
      } else if (response.status === 403) {
        setNotFound(true) // User doesn't have access to this conversation
      } else {
        console.error('Error loading conversation:', response.statusText)
        setNotFound(true)
      }
    } catch (error) {
      console.error('Error loading conversation:', error)
      setNotFound(true)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-secondary">
        <div className="text-lg text-primary">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect to signin
  }

  if (notFound) {
    return (
      <div className="flex h-screen items-center justify-center bg-secondary">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-4">Conversation Not Found</h1>
          <p className="text-text-secondary mb-6">
            The conversation you're looking for doesn't exist or has been deleted.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-primary-blue/90 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <MainLayout
      header={<Header />}
      sidebar={<Sidebar />}
      chat={<ChatInterface />}
    />
  )
}
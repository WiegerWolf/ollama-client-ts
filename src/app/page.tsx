"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ChatInterface } from "@/components/chat/chat-interface"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { MainLayout } from "@/components/layout/main-layout"
import { useChatStore } from "@/stores/chat-store"
import { Plus, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setConversations, selectedModel } = useChatStore()
  const [isLoading, setIsLoading] = useState(true)
  const [hasConversations, setHasConversations] = useState(false)

  useEffect(() => {
    if (status === "loading") return // Still loading

    if (!session) {
      router.push("/auth/signin")
      return
    }

    // Check for existing conversations and redirect appropriately
    checkAndRedirect()
  }, [session, status, router, searchParams])

  const checkAndRedirect = async () => {
    try {
      // Check if there's a callbackUrl from the auth flow
      const callbackUrl = searchParams.get('callbackUrl')
      
      if (callbackUrl) {
        // User came from auth flow with intended destination
        router.push(decodeURIComponent(callbackUrl))
        return
      }

      const response = await fetch('/api/conversations')
      if (response.ok) {
        const conversations = await response.json()
        setConversations(conversations)
        
        if (conversations.length > 0) {
          // Only redirect to most recent conversation if user accessed home directly
          const mostRecent = conversations[0] // Already sorted by updatedAt DESC
          router.push(`/conversation/${mostRecent.id}`)
          return
        } else {
          setHasConversations(false)
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
      setHasConversations(false)
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
        router.push(`/conversation/${newConversation.id}`)
      }
    } catch (error) {
      console.error('Error creating conversation:', error)
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

  // Always show the chat interface, even if no conversations exist
  return (
    <MainLayout
      header={<Header />}
      sidebar={<Sidebar />}
      chat={<ChatInterface />}
    />
  )
}

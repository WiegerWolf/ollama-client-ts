"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useChatStore } from "@/stores/chat-store"
import { ChatMessage } from "@/lib/ollama-client"
import { formatRelativeTime } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: string
  content: string
  createdAt: string
}

export function ChatInterface() {
  const {
    currentConversation,
    selectedModel,
    temperature,
    systemPrompt,
    isStreaming,
    setIsStreaming,
    addMessage,
    updateMessage
  } = useChatStore()

  const [input, setInput] = useState("")
  const [streamingMessage, setStreamingMessage] = useState("")
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [currentConversation?.messages, streamingMessage])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!input.trim() || !currentConversation || isStreaming) return

    const userMessage = input.trim()
    setInput("")
    setIsStreaming(true)

    // Add user message to the conversation
    addMessage(currentConversation.id, {
      conversationId: currentConversation.id,
      role: "user",
      content: userMessage,
      metadata: undefined
    })

    // Create assistant message placeholder
    const assistantMessageId = Math.random().toString(36).substr(2, 9)
    setStreamingMessageId(assistantMessageId)
    setStreamingMessage("")

    try {
      // Prepare messages for API
      const messages: ChatMessage[] = [
        ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
        ...currentConversation.messages.map(msg => ({
          role: msg.role as ChatMessage["role"],
          content: msg.content
        })),
        { role: "user" as const, content: userMessage }
      ]

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages,
          conversationId: currentConversation.id,
          temperature,
          stream: true
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let assistantContent = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(line => line.trim())

        for (const line of lines) {
          try {
            const data = JSON.parse(line)
            
            if (data.message?.content) {
              assistantContent += data.message.content
              setStreamingMessage(assistantContent)
            }

            if (data.done) {
              // Add the complete assistant message
              addMessage(currentConversation.id, {
                conversationId: currentConversation.id,
                role: "assistant",
                content: assistantContent,
                metadata: undefined
              })
              
              setStreamingMessage("")
              setStreamingMessageId(null)
            }
          } catch (parseError) {
            // Skip invalid JSON lines
            continue
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setStreamingMessage("")
      setStreamingMessageId(null)
    } finally {
      setIsStreaming(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  if (!currentConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Welcome to Ollama Chat
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Select a conversation or create a new one to start chatting
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentConversation.messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        
        {/* Streaming message */}
        {streamingMessage && (
          <MessageBubble
            message={{
              id: streamingMessageId || 'streaming',
              role: 'assistant',
              content: streamingMessage,
              createdAt: new Date().toISOString()
            }}
            isStreaming={true}
          />
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="w-full resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
              disabled={isStreaming}
            />
          </div>
          <Button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="px-4 py-3"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}

function MessageBubble({ 
  message, 
  isStreaming = false 
}: { 
  message: Message
  isStreaming?: boolean 
}) {
  const isUser = message.role === 'user'
  
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className={cn(
        "flex max-w-[80%] space-x-3",
        isUser ? "flex-row-reverse space-x-reverse" : "flex-row"
      )}>
        {/* Avatar */}
        <div className={cn(
          "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full",
          isUser 
            ? "bg-blue-500 text-white" 
            : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
        )}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>

        {/* Message */}
        <div className={cn(
          "rounded-lg px-4 py-2",
          isUser
            ? "bg-blue-500 text-white"
            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
        )}>
          <div className="whitespace-pre-wrap break-words">
            {message.content}
            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
            )}
          </div>
          <div className={cn(
            "text-xs mt-1 opacity-70",
            isUser ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
          )}>
            {formatRelativeTime(message.createdAt)}
          </div>
        </div>
      </div>
    </div>
  )
}
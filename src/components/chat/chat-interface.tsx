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
      <div className="flex-1 flex items-center justify-center bg-primary">
        <div className="text-center max-w-[800px] mx-auto px-2xl">
          <Bot className="h-12 w-12 text-tertiary mx-auto mb-3xl" />
          <h2 className="text-display-medium text-primary mb-lg">
            Welcome to Ollama Chat
          </h2>
          <p className="text-body-large text-secondary">
            Select a conversation or create a new one to start chatting with AI models
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-primary h-full">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[800px] mx-auto px-2xl py-lg">
          <div>
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
          </div>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-primary bg-primary">
        <div className="max-w-[800px] mx-auto px-2xl py-lg">
          <form onSubmit={handleSubmit} className="flex space-sm">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="w-full resize-none rounded-lg border border-primary bg-primary px-lg py-md text-primary placeholder-tertiary focus:border-blue focus:outline-none focus:ring-1 focus:ring-blue transition-fast"
                rows={1}
                style={{ minHeight: '44px', maxHeight: '120px' }}
                disabled={isStreaming}
              />
            </div>
            <Button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="px-lg py-md h-11"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
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
    <div className={cn("flex mb-lg", isUser ? "justify-end" : "justify-start")}>
      <div className={cn(
        "flex max-w-[80%] space-md",
        isUser ? "flex-row-reverse space-x-reverse" : "flex-row"
      )}>
        {/* Avatar */}
        <div className={cn(
          "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full",
          isUser
            ? "bg-blue text-white"
            : "bg-secondary text-secondary"
        )}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>

        {/* Message */}
        <div className={cn(
          "rounded-lg px-lg py-md",
          isUser
            ? "bg-blue text-white"
            : "bg-secondary text-primary"
        )}>
          <div className="whitespace-pre-wrap break-words text-body-medium">
            {message.content}
            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
            )}
          </div>
          <div className={cn(
            "text-body-small mt-xs opacity-70",
            isUser ? "text-blue-100" : "text-tertiary"
          )}>
            {formatRelativeTime(message.createdAt)}
          </div>
        </div>
      </div>
    </div>
  )
}
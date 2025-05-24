"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useChatStore } from "@/stores/chat-store"
import { ChatMessage } from "@/lib/ollama-client"
import { formatRelativeTime } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { ConversationModelSelector } from "./conversation-model-selector"
import { ModelChangeNotification } from "@/components/ui/model-change-notification"
import { ModelBadge } from "@/components/ui/model-badge"

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
    getConversationModel,
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
  const [modelChangeNotification, setModelChangeNotification] = useState<{
    fromModel: string | null
    toModel: string
    isVisible: boolean
  } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [currentConversation?.messages, streamingMessage])

  const handleModelChange = (fromModel: string | null, toModel: string) => {
    setModelChangeNotification({
      fromModel,
      toModel,
      isVisible: true
    })
  }

  const closeModelChangeNotification = () => {
    setModelChangeNotification(prev => prev ? { ...prev, isVisible: false } : null)
  }

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
          model: getConversationModel(currentConversation.id),
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
      <div className="flex-1 flex items-center justify-center bg-bg-primary">
        <div className="text-center max-w-[800px] mx-auto px-2xl">
          <div className="bg-bg-secondary rounded-full p-4xl mb-3xl mx-auto w-fit">
            <Bot className="h-12 w-12 text-text-tertiary mx-auto" />
          </div>
          <h2 className="text-display-medium text-text-primary mb-lg">
            Welcome to Ollama Chat
          </h2>
          <p className="text-body-large text-text-secondary">
            Select a conversation or create a new one to start chatting with AI models
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-bg-primary h-full">
      {/* Header with Model Selector */}
      <div className="border-b border-border-primary bg-bg-primary px-2xl py-md">
        <div className="max-w-[800px] mx-auto flex items-center justify-between">
          <div className="flex items-center space-md">
            <h1 className="text-heading-medium text-text-primary font-semibold">
              {currentConversation.title}
            </h1>
          </div>
          <div className="flex items-center space-md">
            <span className="text-body-small text-text-secondary">Model:</span>
            <ConversationModelSelector
              conversationId={currentConversation.id}
              onModelChange={handleModelChange}
            />
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[800px] mx-auto px-2xl py-lg">
          <div className="space-y-lg">
            {currentConversation.messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                conversationId={currentConversation.id}
              />
            ))}
            
            {/* Streaming message */}
            {streamingMessage && (
              <MessageBubble
                message={{
                  id: streamingMessageId || 'streaming',
                  role: 'assistant',
                  content: streamingMessage,
                  createdAt: new Date().toISOString(),
                  model: getConversationModel(currentConversation.id)
                }}
                conversationId={currentConversation.id}
                isStreaming={true}
              />
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border-primary bg-bg-primary shadow-light">
        <div className="max-w-[800px] mx-auto px-2xl py-lg">
          <form onSubmit={handleSubmit} className="flex space-md">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="w-full resize-none rounded-lg border-2 border-border-primary bg-bg-primary px-lg py-md text-text-primary placeholder-text-tertiary focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2 focus:ring-offset-bg-primary transition-all duration-150"
                rows={1}
                style={{ minHeight: '44px', maxHeight: '120px' }}
                disabled={isStreaming}
              />
            </div>
            <Button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="px-lg py-md h-11 focus-ring"
              variant={!input.trim() || isStreaming ? "secondary" : "default"}
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </form>
        </div>
      </div>

      {/* Model Change Notification */}
      {modelChangeNotification && (
        <ModelChangeNotification
          fromModel={modelChangeNotification.fromModel}
          toModel={modelChangeNotification.toModel}
          isVisible={modelChangeNotification.isVisible}
          onClose={closeModelChangeNotification}
        />
      )}
    </div>
  )
}

function MessageBubble({
  message,
  conversationId,
  isStreaming = false
}: {
  message: Message & { model?: string }
  conversationId?: string
  isStreaming?: boolean
}) {
  const { getConversationModel } = useChatStore()
  const isUser = message.role === 'user'
  const messageModel = message.model || (conversationId ? getConversationModel(conversationId) : undefined)
  
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className={cn(
        "flex max-w-[85%] space-md",
        isUser ? "flex-row-reverse space-x-reverse" : "flex-row"
      )}>
        {/* Avatar */}
        <div className={cn(
          "flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-full border-2 shadow-sm relative",
          isUser
            ? "bg-primary-blue border-primary-blue text-white"
            : "bg-bg-secondary border-border-primary text-text-secondary"
        )}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
          {/* Model indicator dot for assistant messages */}
          {!isUser && messageModel && (
            <div className="absolute -bottom-1 -right-1">
              <ModelBadge model={messageModel} variant="dot" size="sm" />
            </div>
          )}
        </div>

        {/* Message */}
        <div className={cn(
          "rounded-lg px-lg py-md shadow-sm border",
          isUser
            ? "bg-primary-blue border-primary-blue text-white"
            : "bg-bg-secondary border-border-primary text-text-primary"
        )}>
          <div className="whitespace-pre-wrap break-words text-body-medium leading-relaxed">
            {message.content}
            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1 rounded-sm" />
            )}
          </div>
          <div className={cn(
            "text-body-small mt-md opacity-75 flex items-center justify-between",
            isUser ? "text-blue-100" : "text-text-tertiary"
          )}>
            <span>{formatRelativeTime(message.createdAt)}</span>
            {/* Model badge for assistant messages */}
            {!isUser && messageModel && (
              <ModelBadge
                model={messageModel}
                size="sm"
                variant="compact"
                className="ml-md"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
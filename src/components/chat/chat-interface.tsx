"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useChatStore } from "@/stores/chat-store"
import { ChatMessage } from "@/lib/ollama-client"
import { formatRelativeTime } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { ConversationModelSelector } from "./conversation-model-selector"
import { ModelBadge } from "@/components/ui/model-badge"
import { ThinkingSections } from "@/components/ui/thinking-section"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"
import { parseMessageContent, parseStreamingContent } from "@/lib/content-parser"

interface Message {
  id: string
  role: string
  content: string
  createdAt: string
  metadata?: string
}

export function ChatInterface() {
  const {
    currentConversation,
    selectedModel,
    getConversationModel,
    temperature,
    systemPrompt,
    isStreaming,
    isCancelling,
    setIsStreaming,
    setIsCancelling,
    cancelGeneration,
    addMessage,
    updateMessage
  } = useChatStore()

  const [input, setInput] = useState("")
  const [streamingMessage, setStreamingMessage] = useState("")
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [currentConversation?.messages, streamingMessage])


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!input.trim() || isStreaming) return

    // If no current conversation, create one first
    if (!currentConversation) {
      await createNewConversation()
      return
    }

    const userMessage = input.trim()
    setInput("")
    setIsStreaming(true)
    setIsCancelling(false)

    // Create new AbortController for this request
    const abortController = new AbortController()
    abortControllerRef.current = abortController

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
        signal: abortController.signal
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
        // Check if request was aborted
        if (abortController.signal.aborted) {
          break
        }

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
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled - clean up streaming state
        console.log('Request cancelled by user')
      } else {
        console.error('Error sending message:', error)
      }
      setStreamingMessage("")
      setStreamingMessageId(null)
    } finally {
      setIsStreaming(false)
      setIsCancelling(false)
      abortControllerRef.current = null
    }
  }

  const handleStop = () => {
    if (abortControllerRef.current && !isCancelling) {
      setIsCancelling(true)
      cancelGeneration()
      abortControllerRef.current.abort()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isStreaming) {
        handleSubmit(e)
      }
    }
  }

  // Cleanup AbortController on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

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
        // The store should automatically update, and we can retry the submit
        setTimeout(() => {
          if (input.trim()) {
            handleSubmit(new Event('submit') as any)
          }
        }, 100)
      }
    } catch (error) {
      console.error('Error creating conversation:', error)
    }
  }

  // Always show the chat interface, even without a conversation

  return (
    <div className="flex-1 flex flex-col bg-bg-primary h-full">
      {/* Header with Model Selector */}
      <div className="border-b border-border-primary bg-bg-primary px-2xl py-md">
        <div className="max-w-[800px] mx-auto flex items-center justify-between">
          <div className="flex items-center space-md">
            <h1 className="text-heading-medium text-text-primary font-semibold">
              {currentConversation?.title || 'Chat Interface'}
            </h1>
          </div>
          <div className="flex items-center space-md">
            <span className="text-body-small text-text-secondary">Model:</span>
            {currentConversation ? (
              <ConversationModelSelector
                conversationId={currentConversation.id}
              />
            ) : (
              <span className="text-body-small text-text-primary">{selectedModel}</span>
            )}
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[800px] mx-auto px-2xl py-lg">
          {!currentConversation ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md mx-auto p-8">
                <div className="bg-bg-secondary rounded-full p-6 mb-6 mx-auto w-fit">
                  <Bot className="h-12 w-12 mx-auto text-text-tertiary" />
                </div>
                <h2 className="text-2xl font-bold text-text-primary mb-4">
                  Welcome to Ollama Chat
                </h2>
                <p className="text-text-secondary mb-8">
                  Start typing below to begin your first conversation with an AI model.
                </p>
              </div>
            </div>
          ) : (
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
          )}
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
            {isStreaming ? (
              <Button
                type="button"
                onClick={handleStop}
                disabled={isCancelling}
                className="px-lg py-md h-11 focus-ring bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700"
                variant="default"
              >
                <Square className="h-4 w-4" />
                <span className="sr-only">{isCancelling ? "Stopping..." : "Stop generation"}</span>
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={!input.trim()}
                className="px-lg py-md h-11 focus-ring"
                variant={!input.trim() ? "secondary" : "default"}
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Send message</span>
              </Button>
            )}
          </form>
        </div>
      </div>

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
  const isSystem = message.role === 'system'
  const messageModel = message.model || (conversationId ? getConversationModel(conversationId) : undefined)
  
  // Parse content to extract thinking sections and detect markdown
  let thinkingSections: string[] = []
  let partialThinking: string | null = null
  let regularContent: string = message.content
  let isMarkdown: boolean = false

  if (isStreaming) {
    // For streaming, we parse the content as if it's static to extract thinking sections
    const streamingParsed = parseMessageContent(message.content)
    thinkingSections = streamingParsed.thinkingSections
    partialThinking = null // We don't have partial thinking for streaming display
    regularContent = streamingParsed.regularContent
    isMarkdown = streamingParsed.isMarkdown || false
  } else {
    const staticParsed = parseMessageContent(message.content)
    thinkingSections = staticParsed.thinkingSections
    partialThinking = null // Not used in static parsing either
    regularContent = staticParsed.regularContent
    isMarkdown = staticParsed.isMarkdown || false
  }
  
  const hasThinking = thinkingSections.length > 0
  
  // Special rendering for system messages
  if (isSystem) {
    // Parse metadata to get model change info
    let metadata: any = {}
    try {
      if (message.metadata) {
        metadata = JSON.parse(message.metadata)
      }
    } catch (e) {
      // Ignore parsing errors
    }

    return (
      <div className="flex justify-center my-md">
        <div className="flex items-center space-xs px-md py-xs bg-bg-tertiary border border-border-secondary rounded-full text-body-small text-text-tertiary">
          <span>{message.content}</span>
          {metadata.type === 'model_change' && metadata.fromModel && metadata.toModel && (
            <div className="flex items-center space-xs ml-xs">
              <ModelBadge model={metadata.fromModel} size="sm" variant="compact" />
              <span>→</span>
              <ModelBadge model={metadata.toModel} size="sm" variant="compact" />
            </div>
          )}
        </div>
      </div>
    )
  }
  
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

        {/* Message Container */}
        <div className="flex flex-col space-y-sm max-w-full">
          {/* Thinking Sections - Only for assistant messages */}
          {!isUser && hasThinking && (
            <ThinkingSections
              sections={thinkingSections}
              partialThinking={partialThinking}
            />
          )}

          {/* Regular Message Content */}
          {(regularContent || (!isUser && !hasThinking)) && (
            <div className={cn(
              "rounded-lg px-lg py-md shadow-sm border",
              isUser
                ? "bg-primary-blue border-primary-blue text-white"
                : "bg-bg-secondary border-border-primary text-text-primary"
            )}>
              {/* Render content based on whether it's markdown and if it's a user or assistant message */}
              {!isUser && isMarkdown && regularContent ? (
                <div className="text-body-medium leading-relaxed">
                  <MarkdownRenderer content={regularContent} />
                  {isStreaming && !hasThinking && (
                    <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1 rounded-sm" />
                  )}
                </div>
              ) : (
                <div className="whitespace-pre-wrap break-words text-body-medium leading-relaxed">
                  {regularContent || (isStreaming ? "" : message.content)}
                  {isStreaming && !hasThinking && (
                    <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1 rounded-sm" />
                  )}
                </div>
              )}
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
          )}
        </div>
      </div>
    </div>
  )
}